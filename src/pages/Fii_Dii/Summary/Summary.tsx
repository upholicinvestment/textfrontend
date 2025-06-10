import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Divider,
  Stack,
  useMediaQuery,
  useTheme,
} from '@mui/material';

type SegmentRow = {
  segment: string;
  netOI: number;
  change: number;
};

type ParticipantType = {
  participant: string;
  rows: SegmentRow[];
};

const Summary = () => {
  const [participants, setParticipants] = useState<ParticipantType[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch available dates from DB
  useEffect(() => {
    fetch('https://api.upholictech.com/available-dates')
      .then((res) => res.json())
      .then((data) => {
        setAvailableDates(data);
        if (data.length) {
          setSelectedDate(data[data.length - 1]); // default to latest date
        }
      })
      .catch((err) => console.error('Error fetching available dates:', err));
  }, []);

  // Fetch summary for selected date
  useEffect(() => {
    if (!selectedDate) return;
    fetch(`https://api.upholictech.com/summary?date=${selectedDate}`)
      .then((res) => res.json())
      .then((result) => {
        setParticipants(result.data || []);
      })
      .catch((err) => console.error('Error fetching summary:', err));
  }, [selectedDate]);

  const goToPreviousDate = () => {
    const index = availableDates.indexOf(selectedDate);
    if (index > 0) {
      setSelectedDate(availableDates[index - 1]);
    }
  };

  const goToNextDate = () => {
    const index = availableDates.indexOf(selectedDate);
    if (index < availableDates.length - 1) {
      setSelectedDate(availableDates[index + 1]);
    }
  };

  return (
    <Box p={4} sx={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        mb={4}
      >
        <Typography variant="h5" fontWeight="bold">
          Participant Summary
        </Typography>

        <Box display="flex" alignItems="center" gap={1} mt={isSmallScreen ? 2 : 0}>
          <button
            onClick={goToPreviousDate}
            disabled={availableDates.indexOf(selectedDate) <= 0}
            style={{
              padding: '9px 12px',
              fontSize: '18px',
              cursor: 'pointer',
              borderRadius: '6px',
              border: '1px solid #ccc',
              background: '#fff',
            }}
          >
            &lt;
          </button>

          <TextField
            type="date"
            size="small"
            sx={{ width: 180 }}
            inputProps={{
              style: { padding: '10px 14px' },
              min: availableDates[0],
              max: availableDates[availableDates.length - 1],
              list: 'available-dates',
            }}
            value={selectedDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const val = e.target.value;
              if (availableDates.includes(val)) {
                setSelectedDate(val);
              }
            }}
          />
          <datalist id="available-dates">
            {availableDates.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>

          <button
            onClick={goToNextDate}
            disabled={availableDates.indexOf(selectedDate) >= availableDates.length - 1}
            style={{
              padding: '9px 12px',
              fontSize: '18px',
              cursor: 'pointer',
              borderRadius: '6px',
              border: '1px solid #ccc',
              background: '#fff',
            }}
          >
            &gt;
          </button>
        </Box>
      </Box>

      <Box
        display="flex"
        flexWrap="wrap"
        gap={3}
        justifyContent={isSmallScreen ? 'center' : 'flex-start'}
      >
        {participants.length === 0 ? (
          <Typography variant="body1" color="textSecondary">
            No data available for {selectedDate}
          </Typography>
        ) : (
          participants.map((participant) => (
            <Card
              key={participant.participant}
              elevation={4}
              sx={{
                width: isSmallScreen ? '100%' : 'calc(50% - 12px)',
                borderRadius: 3,
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  color="primary"
                  gutterBottom
                >
                  {participant.participant}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={2}>
                  {participant.rows.map((row, index) => (
                    <Box
                      key={index}
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      p={1.5}
                      sx={{
                        backgroundColor: index % 2 === 0 ? '#f0f0f0' : '#ffffff',
                        borderRadius: 2,
                      }}
                    >
                      <Typography sx={{ width: '33%' }}>{row.segment}</Typography>
                      <Typography sx={{ width: '33%' }}>Net OI: {row.netOI}</Typography>
                      <Typography sx={{ width: '33%' }}>
                        Change: {row.change}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          ))
        )}
      </Box>
    </Box>
  );
};

export default Summary;