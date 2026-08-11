import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import type {
  PermissionRow,
  StaffRoleOption,
  StaffUserRow,
} from '../lib/erp-types';
import type { Station, UserRole } from '../lib/types';
import { useAuthStore } from '../store/auth';

const OPS_MANAGEABLE: UserRole[] = [
  'STATION_MANAGER',
  'ATTENDANT',
  'STOREKEEPER',
  'SAFETY_OFFICER',
];

function assignableRoles(
  actorRole: UserRole,
  roles: StaffRoleOption[],
): StaffRoleOption[] {
  if (actorRole === 'OPERATIONS_MANAGER') {
    return roles.filter((role) => OPS_MANAGEABLE.includes(role.value));
  }
  if (actorRole === 'DIRECTOR') {
    return roles.filter((role) => role.value !== 'SYSTEM_ADMIN');
  }
  return roles;
}

function formatRole(role: UserRole) {
  return role.replaceAll('_', ' ');
}

const emptyCreateForm = {
  username: '',
  fullName: '',
  password: '',
  sendInvite: true,
  role: 'ATTENDANT' as UserRole,
  email: '',
  phone: '',
  stationId: '',
  canOverridePrice: false,
  discountLimitPercent: 0,
};

export function StaffPage() {
  const qc = useQueryClient();
  const actor = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<'staff' | 'permissions'>('staff');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('ATTENDANT');
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [editForm, setEditForm] = useState({
    fullName: '',
    password: '',
    role: 'ATTENDANT' as UserRole,
    email: '',
    phone: '',
    stationId: '',
    isActive: true,
    canOverridePrice: false,
    discountLimitPercent: 0,
  });

  const canViewStaff = actor?.permissions?.includes('staff.view');
  const canManagePermissions = actor?.permissions?.includes('security.role.manage');

  const { data: roles = [] } = useQuery({
    queryKey: ['staff-roles'],
    queryFn: async () => (await api.get<StaffRoleOption[]>('/users/roles')).data,
    enabled: !!canViewStaff,
  });

  const { data: stations = [] } = useQuery({
    queryKey: ['stations-list'],
    queryFn: async () => (await api.get<Station[]>('/stations')).data,
    enabled: !!canViewStaff,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff-list'],
    queryFn: async () => (await api.get<StaffUserRow[]>('/users')).data,
    enabled: !!canViewStaff,
  });

  const { data: permissionCatalog = [] } = useQuery({
    queryKey: ['permission-catalog'],
    queryFn: async () => (await api.get<PermissionRow[]>('/permissions')).data,
    enabled: !!canManagePermissions,
  });

  const { data: loadedRolePermissions = [] } = useQuery({
    queryKey: ['role-permissions', selectedRole],
    queryFn: async () =>
      (await api.get<string[]>(`/permissions/roles/${selectedRole}`)).data,
    enabled: !!canManagePermissions,
  });

  useEffect(() => {
    setRolePermissions(loadedRolePermissions);
  }, [loadedRolePermissions]);

  const roleOptions = useMemo(
    () => (actor ? assignableRoles(actor.role, roles) : []),
    [actor, roles],
  );

  const createRoleMeta = roleOptions.find((role) => role.value === createForm.role);
  const editRoleMeta = roleOptions.find((role) => role.value === editForm.role);

  const permissionsByCategory = useMemo(() => {
    const groups = new Map<string, PermissionRow[]>();
    for (const permission of permissionCatalog) {
      const list = groups.get(permission.category) ?? [];
      list.push(permission);
      groups.set(permission.category, list);
    }
    return groups;
  }, [permissionCatalog]);

  const createStaff = useMutation({
    mutationFn: () =>
      api.post('/users', {
        username: createForm.username,
        fullName: createForm.fullName,
        password: createForm.sendInvite ? undefined : createForm.password,
        sendInvite: createForm.sendInvite,
        role: createForm.role,
        email: createForm.email || undefined,
        phone: createForm.phone || undefined,
        stationId: createRoleMeta?.requiresStation ? createForm.stationId : null,
        canOverridePrice: createForm.canOverridePrice,
        discountLimitPercent: createForm.discountLimitPercent,
      }),
    onSuccess: () => {
      setMsg(createForm.sendInvite ? 'Staff member created and invite sent' : 'Staff member created');
      setError('');
      setCreateForm(emptyCreateForm);
      qc.invalidateQueries({ queryKey: ['staff-list'] });
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string | string[] } } })?.response
          ?.data?.message ?? 'Could not create staff member';
      setError(Array.isArray(message) ? message.join(', ') : message);
    },
  });

  const updateStaff = useMutation({
    mutationFn: () =>
      api.patch(`/users/${editId}`, {
        fullName: editForm.fullName,
        password: editForm.password || undefined,
        role: editForm.role,
        email: editForm.email || undefined,
        phone: editForm.phone || undefined,
        stationId: editRoleMeta?.requiresStation ? editForm.stationId : null,
        isActive: editForm.isActive,
        canOverridePrice: editForm.canOverridePrice,
        discountLimitPercent: editForm.discountLimitPercent,
      }),
    onSuccess: () => {
      setMsg('Staff member updated');
      setError('');
      setEditId(null);
      qc.invalidateQueries({ queryKey: ['staff-list'] });
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string | string[] } } })?.response
          ?.data?.message ?? 'Could not update staff member';
      setError(Array.isArray(message) ? message.join(', ') : message);
    },
  });

  const resendInvite = useMutation({
    mutationFn: (id: string) => api.post(`/users/${id}/invite`),
    onSuccess: () => {
      setMsg('Invite email sent');
      setError('');
      qc.invalidateQueries({ queryKey: ['staff-list'] });
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Could not send invite';
      setError(message);
    },
  });

  const saveRolePermissions = useMutation({
    mutationFn: () =>
      api.patch(`/permissions/roles/${selectedRole}`, {
        permissions: rolePermissions,
      }),
    onSuccess: () => {
      setMsg(`Permissions updated for ${formatRole(selectedRole)}`);
      setError('');
      qc.invalidateQueries({ queryKey: ['role-permissions', selectedRole] });
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Could not save permissions';
      setError(message);
    },
  });

  if (!canViewStaff) {
    return <Navigate to="/" replace />;
  }

  const startEdit = (member: StaffUserRow) => {
    setEditId(member.id);
    setEditForm({
      fullName: member.fullName,
      password: '',
      role: member.role,
      email: member.email ?? '',
      phone: member.phone ?? '',
      stationId: member.stationId ?? '',
      isActive: member.isActive,
      canOverridePrice: member.canOverridePrice,
      discountLimitPercent: member.discountLimitPercent,
    });
    setMsg('');
    setError('');
  };

  const togglePermission = (key: string) => {
    setRolePermissions((current) =>
      current.includes(key) ? current.filter((k) => k !== key) : [...current, key],
    );
  };

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    createStaff.mutate();
  };

  const onUpdate = (e: FormEvent) => {
    e.preventDefault();
    updateStaff.mutate();
  };

  return (
    <div className="stack">
      <PageHeader
        title="Staff & roles"
        subtitle="Create staff accounts, send email invites, and configure role permissions"
      />

      <div className="row">
        <button
          type="button"
          className={`btn ${tab === 'staff' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setTab('staff')}
        >
          Staff accounts
        </button>
        {canManagePermissions && (
          <button
            type="button"
            className={`btn ${tab === 'permissions' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab('permissions')}
          >
            Role permissions
          </button>
        )}
      </div>

      {msg && <div className="panel ok-panel">{msg}</div>}
      {error && <div className="panel warn-panel">{error}</div>}

      {tab === 'staff' ? (
        <>
          <div className="grid two">
            <div className="panel">
              <h3 className="panel-title">Add staff member</h3>
              <form className="stack" onSubmit={onCreate}>
                <label className="row">
                  <input
                    type="checkbox"
                    checked={createForm.sendInvite}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, sendInvite: e.target.checked })
                    }
                  />
                  Send email invite instead of setting a password now
                </label>
                <label>
                  Username
                  <input
                    value={createForm.username}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, username: e.target.value })
                    }
                    required
                    autoComplete="off"
                  />
                </label>
                <label>
                  Full name
                  <input
                    value={createForm.fullName}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, fullName: e.target.value })
                    }
                    required
                  />
                </label>
                {createForm.sendInvite ? (
                  <label>
                    Work email
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, email: e.target.value })
                      }
                      required
                    />
                  </label>
                ) : (
                  <label>
                    Temporary password
                    <input
                      type="password"
                      value={createForm.password}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, password: e.target.value })
                      }
                      minLength={8}
                      required
                      autoComplete="new-password"
                    />
                  </label>
                )}
                <label>
                  Role
                  <select
                    value={createForm.role}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        role: e.target.value as UserRole,
                      })
                    }
                  >
                    {roleOptions.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </label>
                {createRoleMeta?.requiresStation && (
                  <label>
                    Station
                    <select
                      value={createForm.stationId}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, stationId: e.target.value })
                      }
                      required
                    >
                      <option value="">Select station</option>
                      {stations.map((station) => (
                        <option key={station.id} value={station.id}>
                          {station.code} · {station.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {!createForm.sendInvite && (
                  <label>
                    Email
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, email: e.target.value })
                      }
                    />
                  </label>
                )}
                <label>
                  Phone
                  <input
                    value={createForm.phone}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, phone: e.target.value })
                    }
                  />
                </label>
                <button className="btn btn-primary" type="submit">
                  {createForm.sendInvite ? 'Create & send invite' : 'Create staff member'}
                </button>
              </form>
            </div>

            <div className="panel">
              <h3 className="panel-title">Staff register</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Station</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map((member) => (
                      <tr key={member.id}>
                        <td>
                          <strong>{member.fullName}</strong>
                          <div className="muted">{member.username}</div>
                          {member.email && <div className="muted">{member.email}</div>}
                        </td>
                        <td>{formatRole(member.role)}</td>
                        <td>
                          {member.station
                            ? `${member.station.code} · ${member.station.name}`
                            : 'Network'}
                        </td>
                        <td>
                          {member.invitePending ? (
                            <span className="badge warn">Invite pending</span>
                          ) : (
                            <span className={`badge ${member.isActive ? 'ok' : 'warn'}`}>
                              {member.isActive ? 'Active' : 'Inactive'}
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="row">
                            <button
                              type="button"
                              className="btn btn-ghost"
                              onClick={() => startEdit(member)}
                            >
                              Edit
                            </button>
                            {member.invitePending &&
                              actor?.permissions?.includes('staff.invite') && (
                                <button
                                  type="button"
                                  className="btn btn-ghost"
                                  onClick={() => resendInvite.mutate(member.id)}
                                >
                                  Resend invite
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {editId && (
            <div className="panel">
              <h3 className="panel-title">Edit staff member</h3>
              <form className="stack" onSubmit={onUpdate}>
                <div className="grid two">
                  <label>
                    Full name
                    <input
                      value={editForm.fullName}
                      onChange={(e) =>
                        setEditForm({ ...editForm, fullName: e.target.value })
                      }
                      required
                    />
                  </label>
                  <label>
                    New password
                    <input
                      type="password"
                      value={editForm.password}
                      onChange={(e) =>
                        setEditForm({ ...editForm, password: e.target.value })
                      }
                      minLength={8}
                      placeholder="Leave blank to keep current"
                      autoComplete="new-password"
                    />
                  </label>
                  <label>
                    Role
                    <select
                      value={editForm.role}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          role: e.target.value as UserRole,
                        })
                      }
                      disabled={actor?.id === editId}
                    >
                      {roleOptions.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {editRoleMeta?.requiresStation && (
                    <label>
                      Station
                      <select
                        value={editForm.stationId}
                        onChange={(e) =>
                          setEditForm({ ...editForm, stationId: e.target.value })
                        }
                        required
                      >
                        <option value="">Select station</option>
                        {stations.map((station) => (
                          <option key={station.id} value={station.id}>
                            {station.code} · {station.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label>
                    Email
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Phone
                    <input
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm({ ...editForm, phone: e.target.value })
                      }
                    />
                  </label>
                </div>
                <label className="row">
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) =>
                      setEditForm({ ...editForm, isActive: e.target.checked })
                    }
                    disabled={actor?.id === editId}
                  />
                  Account active
                </label>
                <div className="row">
                  <button className="btn btn-primary" type="submit">
                    Save changes
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setEditId(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      ) : (
        <div className="panel">
          <h3 className="panel-title">Role permission bundles</h3>
          <p className="muted" style={{ marginBottom: '1rem' }}>
            Choose a role and tick the capabilities it should have. Changes apply to all
            users with that role after they sign in again.
          </p>
          <label>
            Role
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
            >
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </label>
          <div className="stack" style={{ marginTop: '1rem' }}>
            {[...permissionsByCategory.entries()].map(([category, items]) => (
              <div key={category}>
                <strong>{category}</strong>
                <div className="stack" style={{ marginTop: '0.5rem' }}>
                  {items.map((permission) => (
                    <label key={permission.key} className="row">
                      <input
                        type="checkbox"
                        checked={rolePermissions.includes(permission.key)}
                        onChange={() => togglePermission(permission.key)}
                      />
                      <span>
                        <code>{permission.key}</code> — {permission.description}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
            onClick={() => saveRolePermissions.mutate()}
          >
            Save role permissions
          </button>
        </div>
      )}
    </div>
  );
}
