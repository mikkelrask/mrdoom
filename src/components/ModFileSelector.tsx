import React, { useState } from 'react';
import { Button, ListGroup, Badge, Form, Modal } from 'react-bootstrap';
import { IModFile } from '../../shared/schema';
// import { invoke } from '../utils/electronUtils'; // Commented out because file is missing

interface ModFileSelectorProps {
  files: IModFile[];
  onFilesChange: (files: IModFile[]) => void;
}

const ModFileSelector: React.FC<ModFileSelectorProps> = ({ files, onFilesChange }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFilePath, setNewFilePath] = useState('');
  const [fileType, setFileType] = useState<IModFile['type']>('wad');

  const handleAddFile = () => {
    // Open file dialog
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        setNewFileName(file.name);
        setNewFilePath(file.path || '');
        setShowAddModal(true);
      }
    };
    fileInput.click();
  };

  const handleConfirmAddFile = () => {
    if (newFileName && newFilePath) {
      const newFile: IModFile = {
        id: Date.now().toString(), // Generate a temporary ID
        name: newFileName,
        path: newFilePath,
        type: fileType
      };
      
      onFilesChange([...files, newFile]);
      resetAddFileForm();
    }
  };

  const handleRemoveFile = (fileId: string) => {
    onFilesChange(files.filter(file => file.id !== fileId));
  };

  const resetAddFileForm = () => {
    setShowAddModal(false);
    setNewFileName('');
    setNewFilePath('');
    setFileType('wad');
  };

  return (
    <div>
      <ListGroup className="mb-3">
        {files.map(file => (
          <ListGroup.Item key={file.id} className="d-flex justify-content-between align-items-center">
            <div>
              {file.name}
              <Badge bg="secondary" className="ms-2">{file.type}</Badge>
            </div>
            <div>
              <Button type="button" variant="outline-danger" size="sm" onClick={e => { e.preventDefault(); e.stopPropagation(); handleRemoveFile(file.id.toString()); }}>
                Remove
              </Button>
            </div>
          </ListGroup.Item>
        ))}
        {files.length === 0 && (
          <ListGroup.Item className="text-muted">
            No files added yet
          </ListGroup.Item>
        )}
      </ListGroup>
      
      <button type="button" onClick={e => { e.preventDefault(); e.stopPropagation(); handleAddFile(); }} className="btn btn-primary">
        Add File
      </button>
      
      <Button type="button" variant="outline-primary" onClick={e => { e.preventDefault(); e.stopPropagation(); handleAddFile(); }}>
        Browse...
      </Button>
      
      {/* Modal for file type selection */}
      <Modal show={showAddModal} onHide={resetAddFileForm}>
        <Modal.Header closeButton>
          <Modal.Title>Configure File</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>File Name</Form.Label>
              <Form.Control 
                type="text" 
                value={newFileName} 
                onChange={(e) => setNewFileName(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>File Type</Form.Label>
              <Form.Select
                value={fileType}
                onChange={(e) => setFileType(e.target.value as IModFile['type'])}
              >
                <option value="wad">WAD</option>
                <option value="pk3">PK3</option>
                <option value="other">Other</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>File Path</Form.Label>
              <Form.Control 
                type="text" 
                value={newFilePath} 
                disabled
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="secondary" onClick={e => { e.preventDefault(); e.stopPropagation(); resetAddFileForm(); }}>
            Cancel
          </Button>
          <Button type="button" variant="primary" onClick={e => { e.preventDefault(); e.stopPropagation(); handleConfirmAddFile(); }}>
            Add
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ModFileSelector;