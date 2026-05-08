// Mission Control local API client — local-only bridge to serve.mjs.
(function () {
  const json = async (url, options = {}) => {
    const res = await fetch(url, {
      headers: { 'content-type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    return res.json();
  };

  window.mcLoadState = () => json('/__mc/state');
  window.mcPatchTask = (id, patch, meta = {}) => json('/__mc/task', {
    method: 'POST',
    body: JSON.stringify({ id, patch, meta }),
  });
  window.mcAddTask = (task, meta = {}) => json('/__mc/tasks', {
    method: 'POST',
    body: JSON.stringify({ task, meta }),
  });
  window.mcTaskAction = (id, action, meta = {}) => json('/__mc/action', {
    method: 'POST',
    body: JSON.stringify({ id, action, meta }),
  });
  window.mcReceipts = () => json('/__mc/receipts');

  window.mcColdCallOutcome = (leadId, action, meta = {}) => json('/__mc/coldcall/outcome', {
    method: 'POST',
    body: JSON.stringify({ leadId, action, meta }),
  });
})();
