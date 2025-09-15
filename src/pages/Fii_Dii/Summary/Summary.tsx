import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Stack,
 
  Button,
} from '@mui/material';
import { indigo, teal, deepOrange, purple } from '@mui/material/colors';

type SegmentRow = {
  segment: string;
  netOI: number;
  change: number;
};

type ParticipantType = {
  participant: string;
  rows: SegmentRow[];
};

// Palette for 4 cards: can extend for more!
const headerColors = [
  {
    bg: `linear-gradient(90deg, ${indigo[700]} 60%, ${indigo[400]} 100%)`,
    text: "#fff"
  },
  {
    bg: `linear-gradient(90deg, ${teal[600]} 60%, ${teal[400]} 100%)`,
    text: "#fff"
  },
  {
    bg: `linear-gradient(90deg, ${deepOrange[500]} 60%, ${deepOrange[300]} 100%)`,
    text: "#fff"
  },
  {
    bg: `linear-gradient(90deg, ${purple[600]} 60%, ${purple[300]} 100%)`,
    text: "#fff"
  }
];

const Summary = () => {
  const [participants, setParticipants] = useState<ParticipantType[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
 
  useEffect(() => {
    fetch('https://api.upholictech.com/available-dates')
      .then((res) => res.json())
      .then((data) => {
        setAvailableDates(data);
        if (data.length) {
          setSelectedDate(data[data.length - 1]);
        }
      })
      .catch((err) => console.error('Error fetching available dates:', err));
  }, []);

  const FIXED_ORDER = ["FII","Client","Pro","DII"];

  useEffect(() => {
    if (!selectedDate) return;
    fetch(`https://api.upholictech.com/summary?date=${selectedDate}`)
      .then((res) => res.json())
      // .then((result) => {
      //   setParticipants(result.data || []);
      // })
      .then((result) => {
      const rows: ParticipantType[] = result.data || [];
      const byName = new Map(rows.map(r => [r.participant, r]));
      const ordered = FIXED_ORDER
        .map(name => byName.get(name))
        .filter(Boolean) as ParticipantType[];
      setParticipants(ordered);
    })
      .catch((err) => console.error('Error fetching summary:', err));
  }, [selectedDate]);

  const goToPreviousDate = () => {
    const index = availableDates.indexOf(selectedDate);
    if (index > 0) setSelectedDate(availableDates[index - 1]);
  };

  const goToNextDate = () => {
    const index = availableDates.indexOf(selectedDate);
    if (index < availableDates.length - 1) setSelectedDate(availableDates[index + 1]);
  };

  return (
    <Box sx={{ minHeight: '100vh', p: { xs: 2, sm: 4 }, bgcolor: '#f8fafd' }}>
      {/* Header */}
      <Box
        sx={{
          background: `linear-gradient(90deg, ${indigo[700]} 60%, ${indigo[500]} 100%)`,
          borderRadius: 3,
          p: { xs: 2, sm: 4 },
          mb: 4,
          color: '#fff',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h5" fontWeight="bold" sx={{ letterSpacing: 0.5, mb: { xs: 2, sm: 0 } }}>
          Participant Summary
        </Typography>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Button
            variant="contained"
            onClick={goToPreviousDate}
            disabled={availableDates.indexOf(selectedDate) <= 0}
            sx={{
              minWidth: 38, minHeight: 38, borderRadius: '50%', bgcolor: 'white', color: indigo[600],
              fontWeight: 'bold', fontSize: '18px', boxShadow: 1, '&:hover': { bgcolor: indigo[50] }
            }}
          >&lt;</Button>
          {/* <TextField
            type="date"
            size="small"
            sx={{
              width: 160, bgcolor: "white", borderRadius: 2, boxShadow: 1,
              input: { padding: '10px 12px', fontSize: '1rem', fontWeight: 500 }
            }}
            inputProps={{
              min: availableDates[0],
              max: availableDates[availableDates.length - 1],
              list: 'available-dates',
            }}
            value={selectedDate}
            onChange={e => {
              const val = e.target.value;
              if (availableDates.includes(val)) setSelectedDate(val);
            }}
          /> */}
          <TextField
  type="date"
  size="small"
  sx={{
    width: 160,
    bgcolor: "white",
    borderRadius: 2,
    boxShadow: 1,
    input: { padding: '10px 12px', fontSize: '1rem', fontWeight: 500 }
  }}
  inputProps={{
    min: availableDates[0],
    max: availableDates[availableDates.length - 1],
    // ⛔ remove `list`
  }}
  value={selectedDate}
  onChange={(e) => {
    const val = e.target.value;
    if (availableDates.includes(val)) setSelectedDate(val);
  }}
/>
          <datalist id="available-dates">
            {availableDates.map((d) => <option key={d} value={d} />)}
          </datalist>
          <Button
            variant="contained"
            onClick={goToNextDate}
            disabled={availableDates.indexOf(selectedDate) >= availableDates.length - 1}
            sx={{
              minWidth: 38, minHeight: 38, borderRadius: '50%', bgcolor: 'white', color: indigo[600],
              fontWeight: 'bold', fontSize: '18px', boxShadow: 1, '&:hover': { bgcolor: indigo[50] }
            }}
          >&gt;</Button>
        </Box>
      </Box>

      {/* Cards Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 4,
          justifyItems: 'center',
        }}
      >
        {participants.length === 0 ? (
          <Card
            sx={{
              width: '100%',
              maxWidth: 680,
              p: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#fffbe6',
              color: indigo[900],
              borderRadius: 3,
              fontWeight: 500,
              fontSize: '1.15rem'
            }}
          >
            No data available for {selectedDate}
          </Card>
        ) : (
          participants.map((participant, idx) => {
            const colorIdx = idx % headerColors.length;
            const color = headerColors[colorIdx];
            return (
              <Card
                key={participant.participant}
                elevation={5}
                sx={{
                  width: '100%',
                  maxWidth: 640,
                  minWidth: 290,
                  borderRadius: 4,
                  boxShadow: '0 4px 18px 0 rgba(99,102,241,0.12)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: "#fff",
                  transition: 'box-shadow 0.18s',
                  '&:hover': { boxShadow: `0 8px 36px 0 rgba(99,102,241,0.12)` }
                }}
              >
                {/* Colorful header */}
                <Box
                  sx={{
                    background: color.bg,
                    px: 3,
                    py: 2,
                    borderBottom: `1px solid #eee`
                  }}
                >
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{ color: color.text, letterSpacing: 0.3 }}
                  >
                    {participant.participant}
                  </Typography>
                </Box>
                <CardContent>
                  <Stack spacing={1.5}>
                    {participant.rows.map((row, index) => (
                      <Box
                        key={index}
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        py={1}
                        px={1}
                        sx={{
                          background: index % 2 === 0 ? "#f5f6fa" : "#fff",
                          borderRadius: 2,
                          border: index === 0 ? `1px solid #f0f0f0` : undefined
                        }}
                      >
                        <Typography sx={{ width: '35%', fontWeight: 500, color: indigo[600] }}>
                          {row.segment}
                        </Typography>
                        <Typography sx={{ width: '32%', fontWeight: 600, color: color.bg }}>
                          Net OI: {row.netOI}
                        </Typography>
                        <Typography
                          sx={{
                            width: '33%',
                            fontWeight: 700,
                            color: row.change > 0 ? color.bg : "#666"
                          }}
                        >
                          Change: {row.change}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            );
          })
        )}
      </Box>
    </Box>
  );
};

export default Summary;

