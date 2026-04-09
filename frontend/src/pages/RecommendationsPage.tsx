import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Fade,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  ListAlt as StoryIcon,
  AutoFixHigh as RephraseIcon,
  FolderOpen as ScanIcon,
  Lightbulb as RecommendIcon,
  PlayArrow as ApplyIcon,
} from '@mui/icons-material';
import { colors } from '../theme/theme';
import StoryList from '../components/StoryList';
import RepoScanner from '../components/RepoScanner';
import RecommendationPanel from '../components/RecommendationPanel';
import ApplyChangesPanel from '../components/ApplyChangesPanel';
import RephrasePanel from '../components/RephrasePanel';
import type { JiraStory, RepoScanResponse, ChangeItem } from '../types';

const steps = ['Select Story', 'Rephrase Story', 'Scan Repos', 'Get Recommendations', 'Apply Changes'];

const stepIcons = [
  <StoryIcon key="story" />,
  <RephraseIcon key="rephrase" />,
  <ScanIcon key="scan" />,
  <RecommendIcon key="recommend" />,
  <ApplyIcon key="apply" />,
];

export default function RecommendationsPage() {
  const [selectedStory, setSelectedStory] = useState<JiraStory | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [rephraseComplete, setRephraseComplete] = useState(false);
  const [rephrasedStory, setRephrasedStory] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<RepoScanResponse | null>(null);
  const [approvedChanges, setApprovedChanges] = useState<ChangeItem[] | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [expandedStep, setExpandedStep] = useState(0);

  const handleSelectStory = useCallback((story: JiraStory) => {
    setSelectedStory(story);
    setTitle(story.summary);
    setDescription(story.description);
    setAcceptanceCriteria(story.acceptanceCriteria ?? '');
    setRephraseComplete(false);
    setRephrasedStory(null);
    setScanResult(null);
    setApprovedChanges(null);
    setActiveStep(1);
    setExpandedStep(1);
  }, []);

  const handleRephraseComplete = useCallback((refinedStory?: string) => {
    setRephraseComplete(true);
    setRephrasedStory(refinedStory ?? null);
    if (activeStep < 2) setActiveStep(2);
    setExpandedStep(2);
  }, [activeStep]);

  const handleScanComplete = useCallback((result: RepoScanResponse) => {
    setScanResult(result);
    if (activeStep < 3) setActiveStep(3);
    setExpandedStep(3);
  }, [activeStep]);

  const handleUseRephrased = useCallback((t: string, d: string, ac: string) => {
    setTitle(t);
    setDescription(d);
    setAcceptanceCriteria(ac);
    setScanResult(null);
    setApprovedChanges(null);
    setActiveStep(2);
    setExpandedStep(2);
  }, []);

  const handleApprove = useCallback((changes: ChangeItem[]) => {
    setApprovedChanges(changes);
    setActiveStep(4);
    setExpandedStep(4);
  }, []);

  const handleAccordionChange = (step: number) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    if (isExpanded) {
      setExpandedStep(step);
    }
  };

  const isStepComplete = (step: number): boolean => {
    switch (step) {
      case 0: return !!selectedStory;
      case 1: return rephraseComplete;
      case 2: return !!scanResult;
      case 3: return !!approvedChanges;
      case 4: return false;
      default: return false;
    }
  };

  const isStepEnabled = (step: number): boolean => {
    switch (step) {
      case 0: return true;
      case 1: return !!selectedStory;
      case 2: return rephraseComplete;
      case 3: return !!scanResult;
      case 4: return !!approvedChanges && approvedChanges.length > 0;
      default: return false;
    }
  };

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
          Select a story, rephrase it, scan repos, generate recommendations, and apply changes
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
      <Accordion
        expanded={expandedStep === 0}
        onChange={handleAccordionChange(0)}
        disableGutters
        sx={accordionSx(isStepComplete(0))}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <StepHeader
            icon={stepIcons[0]}
            label="Step 1: Select Story"
            complete={isStepComplete(0)}
            detail={selectedStory ? `${selectedStory.key} — ${selectedStory.summary}` : undefined}
          />
        </AccordionSummary>
        <AccordionDetails>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 3,
            }}
          >
            <Box sx={{ height: { xs: 'auto', md: 'calc(100vh - 480px)' } }}>
              <StoryList
                onSelectStory={handleSelectStory}
                selectedStoryKey={selectedStory?.key ?? null}
              />
            </Box>
            {selectedStory && (
              <Fade in timeout={400}>
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: colors.onSurfaceVariant, mb: 1 }}>
                    Working Story: <strong>{selectedStory.key}</strong> — {title}
                  </Typography>
                </Box>
              </Fade>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Step 2: Rephrase Story */}
      <Accordion
        expanded={expandedStep === 1}
        onChange={handleAccordionChange(1)}
        disabled={!isStepEnabled(1)}
        disableGutters
        sx={accordionSx(isStepComplete(1))}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <StepHeader
            icon={stepIcons[1]}
            label="Step 2: Rephrase Story"
            complete={isStepComplete(1)}
            detail={rephraseComplete ? 'Rephrase complete' : undefined}
          />
        </AccordionSummary>
        <AccordionDetails>
          {selectedStory ? (
            <RephrasePanel
              title={title}
              description={description}
              acceptanceCriteria={acceptanceCriteria}
              onUseRephrased={handleUseRephrased}
              onRephraseComplete={handleRephraseComplete}
            />
          ) : (
            <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.88rem' }}>
              Please select a story first.
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Step 3: Scan Repos */}
      <Accordion
        expanded={expandedStep === 2}
        onChange={handleAccordionChange(2)}
        disabled={!isStepEnabled(2)}
        disableGutters
        sx={accordionSx(isStepComplete(2))}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <StepHeader
            icon={stepIcons[2]}
            label="Step 3: Scan Repos"
            complete={isStepComplete(2)}
            detail={scanResult ? `${scanResult.totalRepos} repo(s) scanned` : !rephraseComplete ? 'Please rephrase the story first' : undefined}
          />
        </AccordionSummary>
        <AccordionDetails>
          {rephraseComplete ? (
            <RepoScanner onScanComplete={handleScanComplete} />
          ) : (
            <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.88rem' }}>
              Please rephrase the story first.
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Step 4: Generate Recommendations */}
      <Accordion
        expanded={expandedStep === 3}
        onChange={handleAccordionChange(3)}
        disabled={!isStepEnabled(3)}
        disableGutters
        sx={accordionSx(isStepComplete(3))}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <StepHeader
            icon={stepIcons[3]}
            label="Step 4: Generate Recommendations"
            complete={isStepComplete(3)}
            detail={!scanResult ? 'Please scan repos first' : approvedChanges ? `${approvedChanges.length} change(s) approved` : undefined}
          />
        </AccordionSummary>
        <AccordionDetails>
          {scanResult && selectedStory ? (
            <RecommendationPanel
              title={title}
              description={description}
              acceptanceCriteria={acceptanceCriteria}
              rephrasedStory={rephrasedStory ?? undefined}
              jiraKey={selectedStory.key}
              scanResult={scanResult}
              onApprove={handleApprove}
            />
          ) : (
            <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.88rem' }}>
              {!scanResult ? 'Please scan repos first.' : 'Please select a story first.'}
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Step 5: Apply Changes */}
      <Accordion
        expanded={expandedStep === 4}
        onChange={handleAccordionChange(4)}
        disabled={!isStepEnabled(4)}
        disableGutters
        sx={accordionSx(isStepComplete(4))}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <StepHeader
            icon={stepIcons[4]}
            label="Step 5: Apply Changes"
            complete={false}
            detail={!approvedChanges ? 'Please approve recommendations first' : undefined}
          />
        </AccordionSummary>
        <AccordionDetails>
          {approvedChanges && approvedChanges.length > 0 && selectedStory ? (
            <ApplyChangesPanel
              jiraKey={selectedStory.key}
              storyTitle={title}
              changes={approvedChanges}
            />
          ) : (
            <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.88rem' }}>
              Please approve recommendations first.
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

/** Shared accordion styling */
function accordionSx(complete: boolean) {
  return {
    '&:before': { display: 'none' },
    borderRadius: '12px !important',
    border: `1px solid ${alpha(complete ? colors.success : colors.outlineVariant, complete ? 0.4 : 0.5)}`,
    boxShadow: 'none',
    overflow: 'hidden',
    '&.Mui-disabled': {
      bgcolor: alpha(colors.surfaceContainer, 0.3),
      opacity: 0.7,
    },
  };
}

/** Section header inside each accordion */
function StepHeader({ icon, label, complete, detail }: {
  icon: React.ReactNode;
  label: string;
  complete: boolean;
  detail?: string;
}) {
  return (
    <Box display="flex" alignItems="center" gap={1.5} flex={1}>
      <Box sx={{ color: complete ? colors.success : colors.primary, display: 'flex' }}>
        {complete ? <CheckIcon /> : icon}
      </Box>
      <Box flex={1}>
        <Typography sx={{
          fontFamily: '"Manrope", sans-serif',
          fontWeight: 700,
          fontSize: '0.92rem',
          color: colors.onSurface,
        }}>
          {label}
        </Typography>
        {detail && (
          <Typography sx={{ fontSize: '0.78rem', color: colors.onSurfaceVariant, mt: 0.25 }}>
            {detail}
          </Typography>
        )}
      </Box>
      {complete && (
        <Chip
          label="Complete"
          size="small"
          sx={{
            bgcolor: alpha(colors.success, 0.1),
            color: colors.success,
            fontWeight: 600,
            fontSize: '0.7rem',
          }}
        />
      )}
    </Box>
  );
}
