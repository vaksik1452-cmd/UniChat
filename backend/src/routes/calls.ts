import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authMiddleware } from '../middleware/auth';

const startCallSchema = z.object({
    chatId: z.string(),
    type: z.enum(['AUDIO', 'VIDEO']),
});

export async function callRoutes(app: FastifyInstance) {
    app.addHook('preHandler', authMiddleware);

    app.get('/', async (request) => {
        const userId = request.user!.id;
        return prisma.call.findMany({
            where: { OR: [{ callerId: userId }, { calleeId: userId }] },
            include: {
                caller: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
                callee: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
                chat: { select: { id: true, name: true, type: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    });

    app.post('/start', async (request, reply) => {
        const body = startCallSchema.parse(request.body);
        const callerId = request.user!.id;
        const membership = await prisma.chatMember.findFirst({ where: { chatId: body.chatId, userId: callerId } });
        if (!membership) return reply.status(403).send({ error: 'Not a member of this chat' });
        const other = await prisma.chatMember.findFirst({ where: { chatId: body.chatId, userId: { not: callerId } } });
        const call = await prisma.call.create({ data: { chatId: body.chatId, callerId, calleeId: other?.userId, type: body.type } });
        return reply.status(201).send(call);
    });

    app.patch('/:id/end', async (request, reply) => {
        const { id } = request.params as { id: string };
        const call = await prisma.call.findFirst({ where: { id, OR: [{ callerId: request.user!.id }, { calleeId: request.user!.id }] } });
        if (!call) return reply.status(404).send({ error: 'Call not found' });
        return reply.send(await prisma.call.update({ where: { id }, data: { endedAt: new Date(), status: 'COMPLETED' } }));
    });
}