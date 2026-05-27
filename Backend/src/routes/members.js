const express = require('express');
const supabase = require('../lib/supabase');

const router = express.Router();

router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('members').select('*').order('id');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase.from('members').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Member not found' });
  res.json(data);
});

module.exports = router;
