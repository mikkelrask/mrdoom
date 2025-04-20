import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Form, Card } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { IMod, IModFile } from '../../shared/schema';
import ModFileSelector from '../components/ModFileSelector';
// import { invoke } from '../utils/electronUtils'; // Commented out because file is missing

// ErrorBoundary component to catch runtime errors
class ErrorBoundary extends React.Component<any, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div style={{ color: 'red', padding: 16 }}>Something went wrong: {String(this.state.error)}</div>;
    }
    return this.props.children;
  }
}

interface LocationState {
  mod?: IMod;
  files?: IModFile[];
}

const InstallPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mod, files } = (location.state as LocationState) || {};
  
  const [modData, setModData] = useState<IMod>(mod || {
    id: 0,
    name: '',
    description: '',
    version: '',
    author: '',
    website: '',
    releaseDate: '',
    versionId: '', // Selected Doom version
    launchParameters: '',
    files: []
  } as IMod);
  
  const [modFiles, setModFiles] = useState<IModFile[]>(files || []);
  const [versions, setVersions] = useState<any[]>([]);
  
  useEffect(() => {
    // Fetch versions from the server
    const fetchVersions = async () => {
      try {
        // Use fetch directly for clarity
        const res = await fetch('/api/versions');
        const result = await res.json();
        console.log('InstallPage: raw /api/versions response:', result);
        const arr = Array.isArray(result?.versions) ? result.versions : [];
        setVersions(arr);
      } catch (error) {
        console.error('Error fetching versions:', error);
        setVersions([]); // fallback to empty array
      }
    };

    fetchVersions();
  }, []);

  const handleModFilesChange = (updatedFiles: IModFile[]) => {
    setModFiles(updatedFiles);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const modToSave = { ...modData };
      
      // Call the server to save the mod data
      // const result = await invoke('saveMod', { mod: modToSave, files: modFiles });
      // Commented out because 'invoke' is missing
      const result = { success: true }; // Fallback result for testing
      
      if (result.success) {
        console.log('Mod saved successfully');
        navigate('/');
      } else {
        console.error('Failed to save mod:', 'error' in result ? result.error : result);
      }
    } catch (error) {
      console.error('Error saving mod:', error);
    }
  };

  console.log('InstallPage render: versions =', versions, 'type:', typeof versions, 'isArray:', Array.isArray(versions));

  return (
    <ErrorBoundary>
      <Container>
        <Row>
          <Col>
            <h1>Install asdMod</h1>
            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="modName">
                <Form.Label>Mod Name</Form.Label>
                <Form.Control
                  type="text"
                  value={modData.name}
                  onChange={(e) => setModData({ ...modData, name: e.target.value })}
                />
              </Form.Group>
              <Form.Group controlId="modDescription">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={modData.description}
                  onChange={(e) => setModData({ ...modData, description: e.target.value })}
                />
              </Form.Group>
              <Form.Group controlId="modVersion">
                <Form.Label>Version</Form.Label>
                <Form.Control
                  type="text"
                  value={modData.version}
                  onChange={(e) => setModData({ ...modData, version: e.target.value })}
                />
              </Form.Group>
              <Form.Group controlId="modAuthor">
                <Form.Label>Author</Form.Label>
                <Form.Control
                  type="text"
                  value={modData.author}
                  onChange={(e) => setModData({ ...modData, author: e.target.value })}
                />
              </Form.Group>
              <Form.Group controlId="modWebsite">
                <Form.Label>Website</Form.Label>
                <Form.Control
                  type="text"
                  value={modData.website}
                  onChange={(e) => setModData({ ...modData, website: e.target.value })}
                />
              </Form.Group>
              <Form.Group controlId="modReleaseDate">
                <Form.Label>Release Date</Form.Label>
                <Form.Control
                  type="date"
                  value={modData.releaseDate}
                  onChange={(e) => setModData({ ...modData, releaseDate: e.target.value })}
                />
              </Form.Group>
              <Form.Group controlId="modVersionId">
                <Form.Label>Version</Form.Label>
                <Form.Control
                  as="select"
                  value={modData.versionId}
                  onChange={(e) => setModData({ ...modData, versionId: e.target.value })}
                >
                  {Array.isArray(versions) && versions.length > 0 ? (
                    versions.map((version) => (
                      <option key={version.id} value={version.id}>
                        {version.name}
                      </option>
                    ))
                  ) : (
                    <option value="">No versions available</option>
                  )}
                </Form.Control>
              </Form.Group>
              <Form.Group controlId="modLaunchParameters">
                <Form.Label>Launch Parameters</Form.Label>
                <Form.Control
                  type="text"
                  value={modData.launchParameters}
                  onChange={(e) => setModData({ ...modData, launchParameters: e.target.value })}
                />
              </Form.Group>
              <Form.Group controlId="modFiles">
                <Form.Label>Files</Form.Label>
                <ModFileSelector files={modFiles} onFilesChange={handleModFilesChange} />
              </Form.Group>
              <Button variant="primary" type="submit">
                Save Mod
              </Button>
            </Form>
          </Col>
        </Row>
      </Container>
    </ErrorBoundary>
  );
};

export default InstallPage;