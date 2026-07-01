import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../context/ApiContext';
import { Icon } from '../Icon/Icon';
import './MembersModal.css';

interface MembersModalProps {
  projectId: number;
  projectName?: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Role {
  id: number;
  name: string;
  title: string;
}

interface Member {
  userId: number;
  username: string;
  email: string;
  roleId: number;
  roleName: string;
  allowedPageId: number | null;
}

// Ответы бэкенда в camelCase; страхуемся и от snake_case на всякий случай.
const normalizeMember = (raw: any): Member => ({
  userId: raw.userId ?? raw.user_id ?? 0,
  username: raw.username ?? raw.userName ?? '',
  email: raw.email ?? '',
  roleId: raw.roleId ?? raw.role_id ?? 0,
  roleName: raw.roleName ?? raw.role_name ?? '',
  allowedPageId: raw.allowedPageId ?? raw.allowed_page_id ?? null,
});

export const MembersModal = ({ projectId, projectName, isOpen, onClose }: MembersModalProps) => {
  const api = useApi();
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState<number>(3); // Developer по умолчанию
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [membersRes, rolesRes] = await Promise.all([
        api.getProjectMembers(projectId),
        api.getRoles(),
      ]);
      setMembers((membersRes.data || []).map(normalizeMember));
      setRoles(rolesRes.data || []);
    } catch (err: any) {
      setError('Не удалось загрузить участников');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [api, projectId]);

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setNotice('');
      setError('');
      loadData();
    }
  }, [isOpen, loadData]);

  const handleInvite = async () => {
    const value = email.trim();
    if (!value) return;
    try {
      setInviting(true);
      setError('');
      setNotice('');
      await api.addProjectMember(projectId, { email: value, roleId, allowedPageId: null });
      setEmail('');
      setNotice(`Приглашён: ${value}`);
      await loadData();
    } catch (err: any) {
      const status = err?.response?.status;
      const serverMsg = err?.response?.data;
      if (status === 404) {
        setError('Пользователь с таким email не зарегистрирован в CAESAR.');
      } else if (status === 400) {
        setError(typeof serverMsg === 'string' ? serverMsg : 'Пользователь уже в проекте.');
      } else if (status === 403) {
        setError('Недостаточно прав для управления участниками.');
      } else {
        setError('Не удалось пригласить пользователя.');
      }
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = async (userId: number, newRoleId: number) => {
    try {
      await api.updateProjectMember(projectId, userId, { roleId: newRoleId });
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data && typeof err.response.data === 'string'
        ? err.response.data : 'Не удалось изменить роль.');
    }
  };

  const handleRemove = async (userId: number, username: string) => {
    if (!confirm(`Удалить ${username} из проекта?`)) return;
    try {
      await api.removeProjectMember(projectId, userId);
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data && typeof err.response.data === 'string'
        ? err.response.data : 'Не удалось удалить участника.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal members-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2><Icon name="user" size={18} /> Участники{projectName ? ` · ${projectName}` : ''}</h2>
          <button className="modal__close" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>

        <div className="members-modal__body">
          <div className="members-invite">
            <div className="members-invite__row">
              <input
                type="email"
                className="members-invite__email"
                placeholder="email пользователя"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleInvite(); }}
              />
              <select
                className="members-invite__role"
                value={roleId}
                onChange={(e) => setRoleId(Number(e.target.value))}
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.title}</option>
                ))}
              </select>
              <button
                className="btn-primary members-invite__btn"
                onClick={handleInvite}
                disabled={inviting || !email.trim()}
              >
                {inviting ? '…' : <><Icon name="mail" size={16} /> Пригласить</>}
              </button>
            </div>
            {error && <div className="members-invite__error">{error}</div>}
            {notice && <div className="members-invite__notice">{notice}</div>}
          </div>

          <div className="members-list">
            {loading ? (
              <p className="members-list__empty">Загрузка…</p>
            ) : members.length === 0 ? (
              <p className="members-list__empty">Участников пока нет</p>
            ) : (
              members.map((m) => (
                <div key={m.userId} className="members-list__item">
                  <div className="members-list__info">
                    <span className="members-list__name">{m.username || m.email}</span>
                    <span className="members-list__email">{m.email}</span>
                  </div>
                  <div className="members-list__controls">
                    <select
                      value={m.roleId}
                      onChange={(e) => handleChangeRole(m.userId, Number(e.target.value))}
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>{r.title}</option>
                      ))}
                    </select>
                    <button
                      className="members-list__remove"
                      title="Удалить из проекта"
                      onClick={() => handleRemove(m.userId, m.username || m.email)}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
