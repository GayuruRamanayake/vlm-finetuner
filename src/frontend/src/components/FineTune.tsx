import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  FormControl,
  InputLabel,
  Input,
} from '@mui/material';
import { finetuneModel, fetchModels, deleteModel, fetchTaskStatus } from '../utils/api';
import { ModelOption } from '../types';
import { toast } from 'react-toastify';

interface FineTuneProps {
  selectedModel: string | null;
  setSelectedModel: (model: string | null) => void;
  toast: typeof toast;
}

const FineTune: React.FC<FineTuneProps> = ({ selectedModel, setSelectedModel, toast }) => {
  const [datasetLink, setDatasetLink] = useState<string>('');
  const [fineTuneStatus, setFineTuneStatus] = useState<string>('');
  const [fineTuneLoading, setFineTuneLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0); // Progress bar state
  const [deleteLoading, setDeleteLoading] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<string>('');
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);

  const [statusUpdates, setStatusUpdates] = useState<
    { epoch?: number; loss?: number; learningRate?: number; status: string }[]
  >([]);
  const statusEndRef = useRef<HTMLDivElement | null>(null);

  const addStatusUpdate = (newUpdate: {
    epoch?: number;
    loss?: number;
    learningRate?: number;
    status: string;
  }) => {
    setStatusUpdates((prev) => [...prev, newUpdate]);
  };

  useEffect(() => {
    if (statusEndRef.current) {
      statusEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [statusUpdates]);

  const loadModels = async () => {
    try {
      const response = await fetchModels();
      const models = response.models || [];
      const options = models.map((model: string) => ({
        value: model,
        label: model,
      }));
      setModelOptions(options);
    } catch (error: any) {
      const errorMessage = error.message || 'Error loading models. Check the console.';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(error);
    }
  };

  useEffect(() => {
    loadModels();
    const savedModel = localStorage.getItem('selectedModel');
    if (savedModel) setSelectedModel(savedModel);
  }, []);

  useEffect(() => {
    localStorage.setItem('selectedModel', selectedModel || '');
    localStorage.setItem('datasetLink', datasetLink);
  }, [selectedModel, datasetLink]);

  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isFocused ? '#2D3748' : '#1E293B',
      borderColor: state.isFocused ? '#5B21B6' : '#4B5563',
      boxShadow: state.isFocused ? '0 0 5px #5B21B6' : 'none',
      '&:hover': { borderColor: '#5B21B6' },
    }),
    menu: (provided: any) => ({ ...provided, backgroundColor: '#1E293B' }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#5B21B6' : state.isFocused ? '#2D3748' : '#1E293B',
      color: '#E2E8F0',
      '&:hover': { backgroundColor: '#2D3748' },
    }),
    singleValue: (provided: any) => ({ ...provided, color: '#E2E8F0' }),
    placeholder: (provided: any) => ({ ...provided, color: '#9CA3AF' }),
  };

  const handleFinetune = async () => {
    if (!selectedModel || !datasetLink) {
      setError('Please select a model and provide a dataset link.');
      toast.error('Please select a model and provide a dataset link.');
      return;
    }
    setFineTuneLoading(true);
    setError('');
    setFineTuneStatus('Starting fine-tuning...');
    setProgress(0);

    try {
      const response = await finetuneModel(selectedModel, datasetLink);
      const taskId = response["task_id"];
      checkFineTuneStatus(taskId);
    } catch (error: any) {
      const errorMessage = error.message || 'Error during fine-tuning. Check the console.';
      setError(errorMessage);
      setFineTuneStatus('');
      toast.error(errorMessage);
    }
  };

  const checkFineTuneStatus = async (taskId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const statusResponse = await fetchTaskStatus(taskId);
        const { status, progress, epoch, loss, learning_rate: learningRate } = statusResponse;

        setProgress(progress || 0);
        setFineTuneStatus(`Status: ${status}`);
        addStatusUpdate({ status, epoch, loss, learningRate });

        if (status === 'COMPLETED') {
          clearInterval(pollInterval);
          setFineTuneStatus('Fine-tuning completed successfully!');
          toast.success('Fine-tuning completed successfully!');
          setFineTuneLoading(false);
        } else if (status === 'FAILED') {
          clearInterval(pollInterval);
          setFineTuneStatus('Fine-tuning failed.');
          toast.error('Fine-tuning failed.');
          setFineTuneLoading(false);
        }
      } catch (error: any) {
        clearInterval(pollInterval);
        toast.error('Error fetching task status.');
        setFineTuneLoading(false);
      }
    }, 5000);
  };

  const handleDelete = async (model: string) => {
    setDeleteLoading((prev) => ({ ...prev, [model]: true }));
    try {
      const response = await deleteModel(model);
      toast.success(response.message || `Model ${model} deleted successfully!`);
      await loadModels();
      if (selectedModel === model) setSelectedModel(null);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete model.';
      toast.error(errorMessage);
      console.error('Delete Error', error);
    }
    setDeleteLoading((prev) => ({ ...prev, [model]: false }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleFinetune();
  };

  return (
    <Box
      className="content-section"
      sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: '1200px', mx: 'auto', width: '100%' }}
    >
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, textAlign: { xs: 'center', sm: 'left' } }}>
        Fine-Tune a Model
      </Typography>
      <Box sx={{ mb: 3 }}>
        <Select
          options={modelOptions}
          onChange={(option) => setSelectedModel(option?.value || null)}
          placeholder="Select a model"
          styles={customStyles}
          value={modelOptions.find((option) => option.value === selectedModel)}
        />
      </Box>
      <TextField
        label="Dataset Link (e.g., Hugging Face dataset)"
        value={datasetLink}
        onChange={(e) => setDatasetLink(e.target.value)}
        onKeyPress={handleKeyPress}
        fullWidth
        margin="normal"
        variant="outlined"
        sx={{
          mb: 2,
          '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: '#4B5563' },
            '&:hover fieldset': { borderColor: '#5B21B6' },
            '&.Mui-focused fieldset': { borderColor: '#5B21B6' },
          },
          '& .MuiInputLabel-root': { color: '#9CA3AF' },
          '& .MuiInputBase-input': { color: '#E2E8F0' },
        }}
      />
      <Button
        variant="contained"
        onClick={handleFinetune}
        disabled={fineTuneLoading}
        sx={{
          mb: 2,
          backgroundColor: '#5B21B6',
          '&:hover': { backgroundColor: '#8B5CF6', transform: 'scale(1.05)', transition: 'all 0.2s ease-in-out' },
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 500,
          width: { xs: '100%', sm: 'auto' },
        }}
      >
        {fineTuneLoading ? <CircularProgress size={24} /> : 'Start Fine-Tuning'}
      </Button>
      {fineTuneLoading && (
        <Box sx={{ mt: 2, width: '100%' }}>
          <LinearProgress variant="determinate" value={progress} sx={{ backgroundColor: '#4B5563', '& .MuiLinearProgress-bar': { backgroundColor: '#5B21B6' } }} />
          <Typography variant="body2" sx={{ color: '#E2E8F0', mt: 1, textAlign: 'center' }}>
            Progress: {progress}%
          </Typography>
        </Box>
      )}
      {error && (
        <Typography variant="body1" color="error" sx={{ mt: 2, textAlign: 'center' }}>
          {error}
        </Typography>
      )}
      {fineTuneStatus && !error && (
        <Typography variant="body1" sx={{ mt: 2, color: '#E2E8F0', textAlign: 'center' }}>
          {fineTuneStatus}
        </Typography>
      )}

      {(fineTuneLoading || fineTuneStatus) && (
        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: "#1E293B",
            height: 250, // Fixed height
            overflowY: "auto", // Scrollable
          }}
        >
          <Typography variant="h6" sx={{ mb: 1, color: "#E2E8F0" }}>
            Fine-Tuning Details
          </Typography>

          <TableContainer component={Paper} sx={{ bgcolor: "#1E293B", maxHeight: 200, overflowY: "auto" }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: "#E2E8F0", fontWeight: "bold" }}>Status</TableCell>
                  <TableCell sx={{ color: "#E2E8F0", fontWeight: "bold" }}>Epoch</TableCell>
                  <TableCell sx={{ color: "#E2E8F0", fontWeight: "bold" }}>Loss</TableCell>
                  <TableCell sx={{ color: "#E2E8F0", fontWeight: "bold" }}>Learning Rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {statusUpdates.map((update, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ color: "#9CA3AF" }}>{update.status}</TableCell>
                    <TableCell sx={{ color: "#9CA3AF" }}>{update.epoch ?? "--"}</TableCell>
                    <TableCell sx={{ color: "#9CA3AF" }}>{update.loss ?? "--"}</TableCell>
                    <TableCell sx={{ color: "#9CA3AF" }}>{update.learningRate ?? "--"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <div ref={statusEndRef} />
        </Box>
      )}
    </Box>
  );
};

export default FineTune;