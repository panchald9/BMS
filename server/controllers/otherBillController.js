const otherBillModel = require('../models/otherBillModel');

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function normalizeKind(raw) {
  const kind = String(raw || '').trim().toLowerCase();
  if (kind === 'client' || kind === 'agent') return kind;
  return '';
}

exports.getOtherBills = async (req, res) => {
  try {
    const kind = normalizeKind(req.query.kind);
    if (req.query.kind !== undefined && !kind) {
      return res.status(400).json({ message: 'kind must be client or agent' });
    }
    const rows = await otherBillModel.getOtherBills({ kind: kind || undefined });
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.createOtherBill = async (req, res) => {
  try {
    const {
      kind: rawKind,
      bill_date,
      group_id,
      client_id,
      agent_id,
      comment,
      amount
    } = req.body || {};

    const kind = normalizeKind(rawKind);
    if (!kind) return res.status(400).json({ message: 'kind must be client or agent' });
    if (!bill_date || amount === undefined || amount === null) {
      return res.status(400).json({ message: 'bill_date and amount are required' });
    }

    const payload = {
      kind,
      bill_date,
      group_id: group_id === undefined || group_id === null || group_id === '' ? null : toNumber(group_id),
      client_id: client_id === undefined || client_id === null || client_id === '' ? null : toNumber(client_id),
      agent_id: agent_id === undefined || agent_id === null || agent_id === '' ? null : toNumber(agent_id),
      comment: comment == null ? '' : String(comment),
      amount: toNumber(amount)
    };

    if (!Number.isFinite(payload.amount)) {
      return res.status(400).json({ message: 'Invalid amount' });
    }
    if (payload.group_id !== null && !Number.isFinite(payload.group_id)) {
      return res.status(400).json({ message: 'Invalid group_id' });
    }
    if (payload.client_id !== null && !Number.isFinite(payload.client_id)) {
      return res.status(400).json({ message: 'Invalid client_id' });
    }
    if (payload.agent_id !== null && !Number.isFinite(payload.agent_id)) {
      return res.status(400).json({ message: 'Invalid agent_id' });
    }

    if (kind === 'client') {
      if (!Number.isFinite(payload.group_id) || !Number.isFinite(payload.client_id)) {
        return res.status(400).json({ message: 'group_id and client_id are required for client other bill' });
      }
      payload.agent_id = null;
    } else {
      if (!Number.isFinite(payload.agent_id)) {
        return res.status(400).json({ message: 'agent_id is required for agent other bill' });
      }
      payload.group_id = null;
      payload.client_id = null;
    }

    const row = await otherBillModel.createOtherBill(payload);
    return res.status(201).json(row);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateOtherBill = async (req, res) => {
  try {
    const id = toNumber(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const {
      kind: rawKind,
      bill_date,
      group_id,
      client_id,
      agent_id,
      comment,
      amount
    } = req.body || {};

    const kind = normalizeKind(rawKind);
    if (!kind) return res.status(400).json({ message: 'kind must be client or agent' });
    if (!bill_date || amount === undefined || amount === null) {
      return res.status(400).json({ message: 'bill_date and amount are required' });
    }

    const payload = {
      kind,
      bill_date,
      group_id: group_id === undefined || group_id === null || group_id === '' ? null : toNumber(group_id),
      client_id: client_id === undefined || client_id === null || client_id === '' ? null : toNumber(client_id),
      agent_id: agent_id === undefined || agent_id === null || agent_id === '' ? null : toNumber(agent_id),
      comment: comment == null ? '' : String(comment),
      amount: toNumber(amount)
    };

    if (!Number.isFinite(payload.amount)) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    if (kind === 'client') {
      if (!Number.isFinite(payload.group_id) || !Number.isFinite(payload.client_id)) {
        return res.status(400).json({ message: 'group_id and client_id are required for client other bill' });
      }
      payload.agent_id = null;
    } else {
      if (!Number.isFinite(payload.agent_id)) {
        return res.status(400).json({ message: 'agent_id is required for agent other bill' });
      }
      payload.group_id = null;
      payload.client_id = null;
    }

    const updated = await otherBillModel.updateOtherBill(id, payload);
    if (!updated) return res.status(404).json({ message: 'Other bill not found' });
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteOtherBill = async (req, res) => {
  try {
    const id = toNumber(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid id' });
    }
    const deleted = await otherBillModel.deleteOtherBill(id);
    if (!deleted) return res.status(404).json({ message: 'Other bill not found' });
    return res.json({ message: 'Other bill deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

