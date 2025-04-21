import express from 'express';
import { spawn } from 'child_process';
import { getMods, getMod, getVersion } from '../../storage';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const versionId = req.query.versionId as string;
    console.log('Fetching mods for versionId:', versionId);
    const mods = await getMods(versionId);
    console.log('Found mods:', mods);
    res.json(mods);
  } catch (error) {
    console.error('Error fetching mods:', error);
    res.status(500).json({ error: 'Failed to fetch mods' });
  }
});

router.post('/:id/launch', async (req, res) => {
  try {
    const modId = req.params.id;
    const mod = await getMod(modId);
    
    if (!mod) {
      return res.status(404).json({ error: 'Mod not found' });
    }

    const version = await getVersion(mod.doomVersionId);
    if (!version) {
      return res.status(404).json({ error: 'Doom version not found' });
    }

    const command = version.executable || 'gzdoom';
    const args = [
      ...(version.args || '').split(' '),
      ...mod.filePath.split(' ')
    ].filter(arg => arg);

    console.log('Launching with command:', command);
    console.log('Arguments:', args);

    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: false
    });

    process.on('error', (err) => {
      console.error('Failed to start GZDoom:', err);
      res.status(500).json({ error: 'Failed to launch game' });
    });

    process.on('exit', (code) => {
      if (code === 0) {
        res.json({ success: true, message: 'Game launched successfully' });
      } else {
        res.status(500).json({ error: 'Game exited with error' });
      }
    });

  } catch (error) {
    console.error('Error launching game:', error);
    res.status(500).json({ error: 'Failed to launch game' });
  }
});

export default router; 