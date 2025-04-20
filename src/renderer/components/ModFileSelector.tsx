import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  FormControlLabel,
  Paper,
  Button,
  Divider,
} from '@mui/material';
import { IModFile } from '../../shared/schema';

interface ModFileSelectorProps {
  files: IModFile[];
  selectedFiles: IModFile[];
  onSelectionChange: (files: IModFile[]) => void;
}

const ModFileSelector: React.FC<ModFileSelectorProps> = ({
  files,
  selectedFiles,
  onSelectionChange,
}) => {
  const [selected, setSelected] = useState<IModFile[]>(selectedFiles || []);

  useEffect(() => {
    setSelected(selectedFiles || []);
  }, [selectedFiles]);

  const handleToggleFile = (file: IModFile) => {
    const isSelected = selected.some(
      (item) => item.id === file.id
    );
    
    let newSelected: IModFile[];
    if (isSelected) {
      newSelected = selected.filter((item) => item.id !== file.id);
    } else {
      newSelected = [...selected, file];
    }
    
    setSelected(newSelected);
    onSelectionChange(newSelected);
  };

  const handleSelectAll = () => {
    if (selected.length === files.length) {
      setSelected([]);
      onSelectionChange([]);
    } else {
      setSelected([...files]);
      onSelectionChange([...files]);
    }
  };

  if (!files || files.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Typography variant="body1">No files available</Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Select Files</Typography>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={handleSelectAll}
        >
          {selected.length === files.length ? 'Deselect All' : 'Select All'}
        </Button>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <List dense>
        {files.map((file) => {
          const isSelected = selected.some(item => item.id === file.id);
          const fileName = file.name || file.fileName || 'Unnamed file';
          const fileType = file.type || file.fileType || 'unknown';
          
          return (
            <ListItem 
              key={file.id.toString()} 
              dense 
              sx={{ 
                borderRadius: 1,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    edge="start"
                    checked={isSelected}
                    onChange={() => handleToggleFile(file)}
                  />
                }
                label={
                  <ListItemText 
                    primary={fileName}
                    secondary={`Type: ${fileType}`}
                  />
                }
                sx={{ width: '100%' }}
              />
            </ListItem>
          );
        })}
      </List>
    </Paper>
  );
};

export default ModFileSelector;