import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function AdminPage() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [channels, setChannels] = useState<any[]>([]);
    const [error, setError] = useState('');

    const load = async () => {
        try {
            const [nextStats, nextUsers, nextChannels] = await Promise.all([
                api.getAdminStats(),
                api.getAdminUsers(),
                api.getAdminChannels(),
            ]);
            setStats(nextStats);
            setUsers(nextUsers.users || []);
            setChannels(nextChannels || []);
        } catch (err: any) {
            setError(err.message || 'Не удалось загрузить панель');
        }
    };

    useEffect(() => { load(); }, []);

    const toggleBlock = async (user: any) => {
        await api.blockAdminUser(user.id, !user.isBlocked);
        await load();
    };

    const toggleVerified = async (user: any) => {
        await api.verifyAdminUser(user.id, !user.isVerified);
        await load();
    };

    const removeUser = async (user: any) => {
        if (!confirm(`Удалить аккаунт ${user.username || user.displayName || user.phone}?`)) return;
        await api.deleteAdminUser(user.id);
        await load();
    };

    const removeChannel = async (channel: any) => {
        if (!confirm(`Удалить канал «${channel.name || 'Без названия'}»?`)) return;
        await api.deleteAdminChannel(channel.id);
        await load();
    };

    return (
        <main className="admin-page">
            <header className="admin-header">
                <button className="btn-icon" onClick={() => navigate('/chat')} title="Назад">←</button>
                <div>
                    <div className="eyebrow">CONTROL ROOM</div>
                    <h1>Админ-панель</h1>
                </div>
                <button className="btn btn-secondary" onClick={load}>Обновить</button>
            </header>
            {error && <div className="admin-error">{error}</div>}
            {stats && (
                <section className="admin-stats">
                    {[
                        ['Пользователи', stats.totalUsers],
                        ['Чаты', stats.totalChats],
                        ['Сообщения', stats.totalMessages],
                        ['Жалобы', stats.activeReports],
                    ].map(([label, value]) => <div className="admin-stat" key={label as string}><span>{label}</span><strong>{value}</strong></div>)}
                </section>
            )}
            <section className="admin-panel">
                <div className="admin-panel-heading"><div><span className="eyebrow">COMMUNITY</span><h2>Пользователи</h2></div><span className="admin-count">{users.length}</span></div>
                <div className="admin-user-list">
                    {users.map((user) => <div className="admin-user-row" key={user.id}>
                        <div className="admin-user-main"><div className="avatar avatar-sm avatar-gradient-3">{(user.displayName || user.username || '?').slice(0, 1).toUpperCase()}</div><div><strong>{user.displayName || 'Без имени'} {user.username === 'vaksik14' && <span className="verified-badge" title="Подтверждённый аккаунт">✓</span>}</strong><span>@{user.username || 'без username'} · {user._count?.messages || 0} сообщений</span></div></div>
                        <div className="admin-user-actions"><span className={user.isBlocked ? 'status-chip danger' : 'status-chip'}>{user.isBlocked ? 'Заблокирован' : user.isAdmin ? 'Администратор' : 'Активен'}</span><button className="btn btn-secondary" onClick={() => toggleVerified(user)}>{user.isVerified ? 'Снять галочку' : 'Выдать галочку'}</button><button className="btn btn-secondary" onClick={() => toggleBlock(user)}>{user.isBlocked ? 'Разблокировать' : 'Заблокировать'}</button><button className="btn btn-danger" onClick={() => removeUser(user)}>Удалить</button></div>
                    </div>)}
                </div>
            </section>
            <section className="admin-panel">
                <div className="admin-panel-heading"><div><span className="eyebrow">BROADCAST</span><h2>Каналы</h2></div><span className="admin-count">{channels.length}</span></div>
                <div className="admin-user-list">{channels.map((channel) => <div className="admin-user-row" key={channel.id}><div><strong>{channel.name || 'Без названия'}</strong><span>{channel.isPublic ? 'Публичный' : 'Частный'} · {channel._count?.members || 0} участников · {channel._count?.messages || 0} сообщений</span></div><button className="btn btn-danger" onClick={() => removeChannel(channel)}>Удалить канал</button></div>)}</div>
            </section>
        </main>
    );
}
