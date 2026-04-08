import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Fade,
} from '@mui/material';
import { colors } from '../theme/theme';
import StoryList from '../components/StoryList';
import RepoScanner from '../components/RepoScanner';
import RecommendationPanel from '../components/RecommendationPanel';
import ApplyChangesPanel from '../components/ApplyChangesPanel';
import RephrasePanel from '../components/RephrasePanel';
import type { JiraStory, RepoScanResponse, ChangeItem } from '../types';

const steps = ['Select Story', 'Scan Repos', 'Get Recommendations', 'Apply Changes'];

export default function RecommendationsPage() {
  const [selectedStory, setSelectedStory] = useState<JiraStory | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [scanResult, setScanResult] = useState<RepoScanResponse | null>(null);
  const [approvedChanges, setApprovedChanges] = useState<ChangeItem[] | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  const handleSelectStory = useCallback((story: JiraStory) => {
    setSelectedStory(story);
    setTitle(story.summary);
    setDescription(story.description);
    setAcceptanceCriteria(story.acceptanceCriteria ?? '');
    setApprovedChanges(null);
    if (activeStep < 1) setActiveStep(1);
  }, [activeStep]);

  const handleScanComplete = useCallback((result: RepoScanResponse) => {
    setScanResult(result);
    if (activeStep < 2) setActiveStep(2);
  }, [activeStep]);

  const handleUseRephrased = useCallback((t: string, d: string, ac: string) => {
    setTitle(t);
    setDescription(d);
    setAcceptanceCriteria(ac);
  }, []);

  const handleApprove = useCallback((changes: ChangeItem[]) => {
    setApprovedChanges(changes);
    setActiveStep(3);
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Page Header */}
      <Box>
        <Typography
          variant="h4"
          sx={{
            fontFamily: '"Manrope", sans-serif',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: colors.onSurface,
            fontSize: { xs: '1.4rem', md: '1.7rem' },
            mb: 0.5,
          }}
        >
          Recommendations & Apply
        </Typography>
        <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.9rem' }}>
          Select a story, scan repos, generate recommendations, and apply changes
        </Typography>
      </Box>

      {/* Stepper */}
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step 1: Select Story */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
        }}
      >
        <Box sx={{ height: { xs: 'auto', md: 'calc(100vh - 380px)' } }}>
          <StoryList
            onSelectStory={handleSelectStory}
            selectedStoryKey={selectedStory?.key ?? null}
          />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {selectedStory && (
            <Fade in timeout={400}>
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: colors.onSurfaceVariant, mb: 1 }}>
                  Working Story: <strong>{selectedStory.key}</strong> — {title}
                </Typography>
                <RephrasePanel
                  title={title}
                  description={description}
                  acceptanceCriteria={acceptanceCriteria}
                  onUseRephrased={handleUseRephrased}
                />
              </Box>
            </Fade>
          )}
        </Box>
      </Box>

      {/* Step 2: Scan Repos */}
      {selectedStory && (
        <Fade in timeout={400}>
          <Box>
            <RepoScanner onScanComplete={handleScanComplete} />
          </Box>
        </Fade>
      )}

      {/* Step 3: Generate Recommendations */}
      {scanResult && selectedStory && (
        <Fade in timeout={400}>
          <Box>
            <RecommendationPanel
              title={title}
              description={description}
              acceptanceCriteria={acceptanceCriteria}
              jiraKey={selectedStory.key}
              scanResult={scanResult}
              onApprove={handleApprove}
            />
          </Box>
        </Fade>
      )}

      {/* Step 4: Apply Changes */}
      {approvedChanges && approvedChanges.length > 0 && selectedStory && (
        <Fade in timeout={400}>
          <Box>
            <ApplyChangesPanel
              jiraKey={selectedStory.key}
              storyTitle={title}
              changes={approvedChanges}
            />
          </Box>
        </Fade>
      )}
    </Box>
  );
}
