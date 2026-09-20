const BASE = process.env.REACT_APP_API_URL || 'https://maharaja-one-ten.vercel.app';

export const getToken = () => localStorage.getItem('mone_token');
export const setToken = (t) => localStorage.setItem('mone_token', t);
export const clearToken = () => localStorage.removeItem('mone_token');

const req = async (method, path, body) => {
  const token = getToken();
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };
  const res = await fetch(`${BASE}${path}`, opts);
  if (res.status === 401) { clearToken(); window.location.reload(); return; }
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `HTTP ${res.status}`); }
  return res.json();
};

const api = {
  register:       (data)      => req('POST',   '/api/auth/register', data),
  login:          (data)      => req('POST',   '/api/auth/login', data),
  me:             ()          => req('GET',    '/api/auth/me'),
  changePassword: (data)      => req('POST',   '/api/auth/change-password', data),
  getMembers:     ()          => req('GET',    '/api/employees'),
  updateMember:   (id, data)  => req('PATCH',  `/api/employees/${id}`, data),
  approveMember:  (id)        => req('PATCH',  `/api/employees/${id}/approve`, {}),
  rejectMember:   (id)        => req('DELETE', `/api/employees/${id}/reject`),
  deleteMember:   (id)        => req('DELETE', `/api/employees/${id}`),
  changeRole:     (id, role)  => req('PATCH',  `/api/employees/${id}/role`, { role }),
  updateScore:    (id, data)  => req('PATCH',  `/api/employees/${id}/score`, data),
  getProjects:    ()          => req('GET',    '/api/projects'),
  createProject:  (data)      => req('POST',   '/api/projects', data),
  updateProject:  (id, data)  => req('PUT',    `/api/projects/${id}`, data),
  createMilestone:(data)      => req('POST',   '/api/milestones', data),
  updateMilestone:(id, data)  => req('PATCH',  `/api/milestones/${id}`, data),
  createTaskList: (data)      => req('POST',   '/api/task-lists', data),
  createTask:     (data)      => req('POST',   '/api/tasks', data),
  updateTask:     (id, data)  => req('PATCH',  `/api/tasks/${id}`, data),
  getOfficeTasks: ()          => req('GET',    '/api/office-tasks'),
  createOfficeTask:(data)     => req('POST',   '/api/office-tasks', data),
  updateOfficeTask:(id, data) => req('PATCH',  `/api/office-tasks/${id}`, data),
  getPerformance: (id)        => req('GET',    `/api/performance/${id}`),
  saveSnapshot:   (data)      => req('POST',   '/api/performance/snapshot', data),
  getDashboard:   ()          => req('GET',    '/api/dashboard'),
  getMessages:    (ch,lim=50) => req('GET',    `/api/messages?channel=${encodeURIComponent(ch)}&limit=${lim}`),
  sendMessage:    (data)      => req('POST',   '/api/messages', data),
  getMessages:    (channel,limit=50) => req('GET', `/api/messages?channel=${encodeURIComponent(channel)}&limit=${limit}`),
  sendMessage:    (data)      => req('POST',   '/api/messages', data),
};

export default api;
