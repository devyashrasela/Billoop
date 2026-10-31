import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';
import {
  useGetStaffListQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeactivateStaffMutation,
} from '../../services/endpoints/staffApi';
import './Staff.css';

export const Staff = () => {
  const currentUser = useSelector(selectCurrentUser);
  const { data: staffData, isLoading, refetch } = useGetStaffListQuery();
  const [createStaff, { isLoading: isCreating }] = useCreateStaffMutation();
  const [updateStaff] = useUpdateStaffMutation();
  const [deactivateStaff] = useDeactivateStaffMutation();

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const staffList = staffData?.data || [];

  const handleOpenInvite = () => {
    setFormData({ name: '', email: '', password: '' });
    setErrorMsg('');
    setSuccessMsg('');
    setIsInviteOpen(true);
  };

  const handleSubmitInvite = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
      };
      if (formData.password?.trim()) {
        payload.password = formData.password.trim();
      }

      await createStaff(payload).unwrap();
      setIsInviteOpen(false);
      setSuccessMsg(`Staff member ${formData.name} invited successfully.`);
      refetch();
    } catch (err) {
      setErrorMsg(err.data?.message || err.data?.fieldErrors?.email || 'Failed to invite staff member.');
    }
  };

  const handleToggleStatus = async (staff) => {
    if (staff.id === currentUser?.id) {
      alert('You cannot deactivate your own account.');
      return;
    }

    try {
      if (staff.isActive) {
        if (confirm(`Deactivate ${staff.name}? They will lose access to the Ops portal.`)) {
          await deactivateStaff(staff.id).unwrap();
        }
      } else {
        await updateStaff({ id: staff.id, isActive: true }).unwrap();
      }
      refetch();
    } catch (err) {
      alert(err.data?.message || 'Action failed.');
    }
  };

  return (
    <div className="staff-page">
      <div className="staff-header">
        <div>
          <h1>Staff & Team Management</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--fs-sm)', marginTop: '4px' }}>
            Invite new operators, manage roles, and review session access
          </p>
        </div>
        <button
          className="btn-primary"
          style={{ width: 'auto', padding: 'var(--space-2) var(--space-4)' }}
          onClick={handleOpenInvite}
        >
          + Invite Staff Member
        </button>
      </div>

      {successMsg && (
        <div style={{ padding: 'var(--space-3)', background: 'var(--color-success-soft, #f0fdf4)', color: 'var(--color-success)', borderRadius: 'var(--radius-sm)' }}>
          {successMsg}
        </div>
      )}

      <div className="staff-card">
        {isLoading ? (
          <p>Loading team members...</p>
        ) : (
          <table className="staff-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((staff) => (
                <tr key={staff.id}>
                  <td style={{ fontWeight: 'var(--fw-medium)' }}>
                    {staff.name} {staff.id === currentUser?.id && '(You)'}
                  </td>
                  <td>{staff.email}</td>
                  <td>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        background: staff.role === 'admin' ? '#fef3c7' : '#e0f2fe',
                        color: staff.role === 'admin' ? '#92400e' : '#0369a1',
                        textTransform: 'uppercase',
                      }}
                    >
                      {staff.role}
                    </span>
                  </td>
                  <td>
                    <span className={staff.isActive ? 'status-active' : 'status-inactive'}>
                      {staff.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--color-text-muted)' }}>
                    {staff.lastLoginAt
                      ? new Date(staff.lastLoginAt).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td>
                    {staff.id !== currentUser?.id && (
                      <button
                        className={`action-btn ${staff.isActive ? 'action-btn-danger' : ''}`}
                        onClick={() => handleToggleStatus(staff)}
                      >
                        {staff.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Invite Staff Member</h2>
              <button
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}
                onClick={() => setIsInviteOpen(false)}
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div style={{ color: 'var(--color-danger)', fontSize: 'var(--fs-sm)', marginBottom: 'var(--space-3)' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmitInvite}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Initial Password (Optional)</label>
                <input
                  type="password"
                  className="form-input"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave blank to email invitation link"
                />
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  If left empty, an email invitation with a secure 48-hour password setup link will be sent.
                </span>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-5)' }}>
                <button
                  type="button"
                  style={{ flex: 1, padding: 'var(--space-2)', background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                  onClick={() => setIsInviteOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1 }}
                  disabled={isCreating}
                >
                  {isCreating ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;
