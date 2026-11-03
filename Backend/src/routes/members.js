const express = require('express');
const supabase = require('../lib/supabase');

const router = express.Router();

const REGION7_MEMBERS = [
  { id: 1, abbr: 'CIT', full_name: 'Cebu Institute of Technology – University', campus: 'N. Bacalso Ave, Cebu City', type: 'Private University' },
  { id: 2, abbr: 'UP', full_name: 'University of the Philippines Cebu', campus: 'Lahug Main Campus & SRP, Cebu City', type: 'State University' },
  { id: 3, abbr: 'USC', full_name: 'University of San Carlos', campus: 'Talamban & Downtown, Cebu City', type: 'Private University' },
  { id: 4, abbr: 'CTU', full_name: 'Cebu Technological University', campus: 'Main Campus, Cebu City', type: 'State University' },
  { id: 5, abbr: 'SU', full_name: 'Silliman University', campus: 'Dumaguete City, Negros Oriental', type: 'Private University' },
  { id: 6, abbr: 'BISU', full_name: 'Bohol Island State University', campus: 'Tagbilaran City, Bohol', type: 'State University' },
  { id: 7, abbr: 'CNU', full_name: 'Cebu Normal University', campus: 'Osmeña Blvd, Cebu City', type: 'State University' },
  { id: 8, abbr: 'DOST', full_name: 'Department of Science & Technology', campus: 'Region VII, Sudlon, Lahug, Cebu City', type: 'Government Agency' },
  { id: 9, abbr: 'DICT', full_name: 'Department of Information & Communications Technology', campus: 'Region VII, Cebu City', type: 'Government Agency' },
  { id: 10, abbr: 'DTI', full_name: 'Department of Trade & Industry', campus: 'Region VII, Cebu City', type: 'Government Agency' },
  { id: 11, abbr: 'DepEd', full_name: 'Department of Education', campus: 'Region VII, Sudlon, Lahug, Cebu City', type: 'Government Agency' },
  { id: 12, abbr: 'CHED', full_name: 'Commission on Higher Education', campus: 'Region VII, Sudlon, Lahug, Cebu City', type: 'Government Agency' },
];

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('members').select('*').order('id');
    if (!error && Array.isArray(data) && data.length > 0) {
      return res.json(data);
    }
  } catch (_) {}
  res.json(REGION7_MEMBERS);
});

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase.from('members').select('*').eq('id', req.params.id).single();
  if (!error && data) return res.json(data);
  const found = REGION7_MEMBERS.find(m => String(m.id) === String(req.params.id) || m.abbr.toLowerCase() === String(req.params.id).toLowerCase());
  if (found) return res.json(found);
  res.status(404).json({ error: 'Member not found' });
});

module.exports = router;
