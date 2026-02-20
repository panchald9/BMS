const billModel = require('../models/billModel');

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

exports.getBills = async (req, res) => {
  try {
    const type = String(req.query.type || '').trim();
    const rows = await billModel.getBills({ type: type || undefined });
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.createBill = async (req, res) => {
  try {
    const {
      bill_date,
      group_id,
      bank_id,
      client_id,
      agent_id,
      amount,
      rate
    } = req.body || {};

    if (!bill_date || !group_id || !client_id || !agent_id || amount === undefined || amount === null) {
      return res.status(400).json({ message: 'bill_date, group_id, client_id, agent_id and amount are required' });
    }

    const payload = {
      bill_date,
      group_id: toNumber(group_id),
      bank_id: bank_id === undefined || bank_id === null || bank_id === '' ? null : toNumber(bank_id),
      client_id: toNumber(client_id),
      agent_id: toNumber(agent_id),
      amount: toNumber(amount),
      rate: rate === undefined || rate === null || rate === '' ? null : toNumber(rate)
    };

    if (!Number.isFinite(payload.group_id) || !Number.isFinite(payload.client_id) || !Number.isFinite(payload.agent_id) || !Number.isFinite(payload.amount)) {
      return res.status(400).json({ message: 'Invalid numeric payload' });
    }
    if (payload.bank_id !== null && !Number.isFinite(payload.bank_id)) {
      return res.status(400).json({ message: 'Invalid bank_id' });
    }
    if (payload.rate !== null && !Number.isFinite(payload.rate)) {
      return res.status(400).json({ message: 'Invalid rate' });
    }

    const row = await billModel.createBill(payload);
    return res.status(201).json(row);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateBill = async (req, res) => {
  try {
    const id = toNumber(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid bill id' });
    }

    const {
      bill_date,
      group_id,
      bank_id,
      client_id,
      agent_id,
      amount,
      rate
    } = req.body || {};

    if (!bill_date || !group_id || !client_id || !agent_id || amount === undefined || amount === null) {
      return res.status(400).json({ message: 'bill_date, group_id, client_id, agent_id and amount are required' });
    }

    const payload = {
      bill_date,
      group_id: toNumber(group_id),
      bank_id: bank_id === undefined || bank_id === null || bank_id === '' ? null : toNumber(bank_id),
      client_id: toNumber(client_id),
      agent_id: toNumber(agent_id),
      amount: toNumber(amount),
      rate: rate === undefined || rate === null || rate === '' ? null : toNumber(rate)
    };

    const updated = await billModel.updateBill(id, payload);
    if (!updated) return res.status(404).json({ message: 'Bill not found' });
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteBill = async (req, res) => {
  try {
    const id = toNumber(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid bill id' });
    }

    const deleted = await billModel.deleteBill(id);
    if (!deleted) return res.status(404).json({ message: 'Bill not found' });
    return res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

