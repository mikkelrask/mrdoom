import React, { useState, useEffect, MouseEvent } from 'react';
import { Select, Button, Modal, Input, message } from 'antd';
import { PlusOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { IModFile } from '@shared/schema';
import { api } from '../api';
import path from 'path';

// Add missing imports for antd and icons
import { Upload, Menu, Popconfirm } from 'antd';
import { UploadOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

interface ModFileSelectorProps {
  value?: string;
  onChange: (path: string, fileName?: string, fileType?: string) => void;
  fileType?: string;
  label?: string;
}

// Add MenuInfo interface if not defined elsewhere
interface MenuInfo {
  key: string;
  keyPath: string[];
  item: React.ReactInstance;
  domEvent: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>;
}

/**
 * A component that displays a dropdown of available mod files to select from,
 * with an option to add a new file.
 */
export const ModFileSelector: React.FC<ModFileSelectorProps> = ({
  value,
  onChange,
  fileType,
  label = 'Mod File'
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [filePath, setFilePath] = useState('');
  const [fileName, setFileName] = useState('');
  const [selectedType, setSelectedType] = useState(fileType || 'wad');
  const [availableFiles, setAvailableFiles] = useState<IModFile[]>([]);
  const [loading, setLoading] = useState(false);

  // Add debug logging for important functions
  console.log("ModFileSelector rendering, current state:", {
    isAddingNew,
    filePath,
    fileName,
    selectedType,
    availableFiles: availableFiles.length,
    value
  });

  // Debug: log props on every render
  useEffect(() => {
    console.log('[ModFileSelector] props:', { value, fileType, label, onChange });
  }, [value, fileType, label, onChange]);

  // Load available mod files
  const loadAvailableFiles = async () => {
    setLoading(true);
    try {
      let files: IModFile[] = [];
      if (fileType) {
        // Load files of specific type
        const res = await api.getModFilesByType(fileType);
        console.log('ModFileSelector: raw getModFilesByType response:', res);
        files = Array.isArray(res) ? res : [];
      } else {
        // Load all files
        const res = await api.getAvailableModFiles();
        console.log('ModFileSelector: raw getAvailableModFiles response:', res);
        files = Array.isArray(res) ? res : [];
      }
      setAvailableFiles(files);
    } catch (error) {
      console.error('Failed to load mod files:', error);
      setAvailableFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvailableFiles();
  }, [fileType]);

  // Debug: log availableFiles when loaded
  useEffect(() => {
    console.log('[ModFileSelector] availableFiles:', availableFiles);
  }, [availableFiles]);

  // Browse for a file - EXTRACTED FROM FORM
  const handleBrowse = async () => {
    try {
      const result = await api.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'WAD Files', extensions: ['wad'] },
          { name: 'PK3 Files', extensions: ['pk3'] },
          { name: 'ZIP Files', extensions: ['zip'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const selectedPath = result.filePaths[0];
        setFilePath(selectedPath);

        // Extract file name and extension
        const baseName = path.basename(selectedPath);
        setFileName(baseName);

        // Try to determine type from extension
        const extension = baseName.split('.').pop()?.toLowerCase() || '';
        if (['wad', 'pk3', 'ipk3', 'zip'].includes(extension)) {
          setSelectedType(extension);
        }
      }
    } catch (error) {
      console.error('Failed to open file dialog:', error);
      message.error('Failed to open file dialog');
    }
  };

  // Add a new file with explicit MouseEvent prevention
  const handleAddNew = async (e?: MouseEvent) => {
    // Explicitly prevent any form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Debug: log filePath, fileName, selectedType
    console.log('[ModFileSelector] handleAddNew', { filePath, fileName, selectedType });
    
    // Validate inputs
    if (!filePath) {
      message.error('Please select a file');
      return;
    }

    if (!fileName) {
      message.error('Please enter a file name');
      return;
    }

    // Add to mod file catalog
    const newFile = {
      filePath,
      fileName,
      fileType: selectedType,
      loadOrder: 0,
      isRequired: false
    };

    try {
      console.log("Adding file to catalog:", newFile);
      // Add the file to the catalog via API
      const savedFile = await api.addToCatalog(newFile);
      console.log("API response:", savedFile);
      
      // Update the local list
      setAvailableFiles(prev => [...prev, savedFile]);
      
      // Close modal
      setIsAddingNew(false);
      
      // Clear the form
      setFilePath('');
      setFileName('');
      
      // Tell the parent about the new file
      console.log('[ModFileSelector] onChange(savedFile.filePath, savedFile.fileName, savedFile.fileType)');
      onChange(savedFile.filePath, savedFile.fileName, savedFile.fileType);
      
      message.success('File added successfully');
    } catch (error) {
      console.error('Failed to add file to catalog:', error);
      message.error('Failed to add file to catalog');
    }
  };

  const handleSelectExisting = (selectedPath: string) => {
    // Debug: log selectedPath
    console.log('[ModFileSelector] handleSelectExisting', { selectedPath });

    // Find the selected file in available files
    const selectedFile = availableFiles.find(file => file.filePath === selectedPath);
    
    if (selectedFile) {
      // Debug: log onChange call
      console.log('[ModFileSelector] onChange(selectedFile.filePath, selectedFile.fileName, selectedFile.fileType)');
      // Return the full details to the parent
      onChange(selectedFile.filePath, selectedFile.fileName, selectedFile.fileType);
    } else {
      // Debug: log onChange call
      console.log('[ModFileSelector] onChange(selectedPath)');
      // Just pass back the path
      onChange(selectedPath);
    }
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ marginBottom: 8 }}>{label}</div>
      <Select
        value={value}
        onChange={handleSelectExisting}
        loading={loading}
        style={{ width: '100%' }}
        placeholder="Select a mod file or add a new one"
        allowClear
        dropdownRender={(menu: React.ReactNode) => (
          <div>
            {menu}
            <div style={{ padding: '8px', borderTop: '1px solid #e8e8e8' }}>
              <div 
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsAddingNew(true);
                }}
                style={{ 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '5px',
                  backgroundColor: '#001529',
                  borderRadius: '4px',
                }}
              >
                <PlusOutlined style={{ marginRight: 8 }} />
                Add New File
              </div>
            </div>
          </div>
        )}
      >
        {(Array.isArray(availableFiles) ? availableFiles : []).map((file) => (
          <Select.Option key={file.id || file.filePath} value={file.filePath}>
            {file.fileName} ({file.fileType})
          </Select.Option>
        ))}
      </Select>

      {/* Modal for adding new files - completely separated from any form */}
      <Modal
        title="Add New Mod File"
        open={isAddingNew}
        onCancel={(e: React.MouseEvent) => {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          setIsAddingNew(false);
        }}
        footer={null}
        destroyOnClose
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>File Path</div>
          <Input
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            addonAfter={
              <div 
                onClick={handleBrowse}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <FolderOpenOutlined style={{ marginRight: 4 }} />
                Browse
              </div>
            }
            placeholder="Select a file..."
          />
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>Display Name</div>
          <Input
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="How this file should appear in lists"
          />
        </div>
        
        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 8 }}>File Type</div>
          <Select 
            value={selectedType} 
            onChange={setSelectedType}
            style={{ width: '100%' }}
          >
            <Select.Option value="wad">WAD</Select.Option>
            <Select.Option value="pk3">PK3</Select.Option>
            <Select.Option value="ipk3">IPK3</Select.Option>
            <Select.Option value="zip">ZIP</Select.Option>
            <Select.Option value="deh">DEH</Select.Option>
            <Select.Option value="bex">BEX</Select.Option>
          </Select>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button 
            onClick={(e: React.MouseEvent) => {
              if (e) {
                e.preventDefault();
                e.stopPropagation();
              }
              setIsAddingNew(false);
            }}
          >
            Cancel
          </Button>
          <Button 
            type="primary"
            onClick={handleAddNew}
          >
            Add File
          </Button>
        </div>
      </Modal>
    </div>
  );
};