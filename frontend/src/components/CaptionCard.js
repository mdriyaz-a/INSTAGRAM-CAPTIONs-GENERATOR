import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  TextField,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  ContentCopy as ContentCopyIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

/**
 * Caption card component to display a generated caption
 * @param {Object} props - Component props
 * @param {Object} props.caption - Caption object
 * @param {string} props.caption.style - Caption style
 * @param {string} props.caption.text - Caption text
 * @param {Array} props.caption.hashtags - Caption hashtags
 * @param {Array} props.caption.emojis - Caption emojis
 * @param {string} props.caption.formatting - Caption formatting suggestions
 * @param {boolean} props.isSelected - Whether the caption is selected
 * @param {Function} props.onSelect - Function to call when the caption is selected
 * @param {Function} props.onEdit - Function to call when the caption is edited
 * @returns {JSX.Element} - Caption card component
 */
const CaptionCard = ({ caption, isSelected, onSelect, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  // Debug the caption object
  console.log('CaptionCard received caption:', caption);

  // Clean up caption text by removing prefixes and unwanted code
  const cleanCaptionText = (text) => {
    if (!text) return "";

    const prefixes = [
      "Here is a simple & lighthearted Instagram caption idea:",
      "Here's a simple caption:",
      "Here's a lighthearted caption:",
      "Here's a simple & lighthearted caption:",
      "Here's a reflective and thoughtful Instagram caption:",
      "Here's a reflective caption:",
      "Here's a thoughtful caption:",
      "Here's a humorous caption:",
      "Here's a casual caption:",
      "Here's a poetic caption:",
      "Here's an Instagram caption:",
      "Sure, how about:",
      "How about:",
      "I suggest:",
      "Try this:",
      "Caption:"
    ];

    let cleanedText = text;

    // Remove prefixes
    for (const prefix of prefixes) {
      if (cleanedText.startsWith(prefix)) {
        cleanedText = cleanedText.substring(prefix.length).trim();
      }
    }

    // Remove quotes if they wrap the entire caption
    if ((cleanedText.startsWith('"') && cleanedText.endsWith('"')) ||
        (cleanedText.startsWith("'") && cleanedText.endsWith("'"))) {
      cleanedText = cleanedText.substring(1, cleanedText.length - 1).trim();
    }

    // Remove any CSS-like code that might appear in the text
    if (cleanedText.includes(";position:") ||
        cleanedText.includes(";font-") ||
        cleanedText.includes(";color:") ||
        cleanedText.includes(";co/or:") ||
        cleanedText.includes(";/eft:") ||
        cleanedText.includes(";/ine-") ||
        cleanedText.includes(";fami/y:") ||
        cleanedText.includes("position:abso/ute")) {

      // Find the position of the CSS code and remove it
      let cssStart = -1;
      const possibleStarts = [
        cleanedText.indexOf(";position:"),
        cleanedText.indexOf("position:abso"),
        cleanedText.indexOf(";/eft:"),
        cleanedText.indexOf(";co/or:")
      ];

      for (const pos of possibleStarts) {
        if (pos > -1 && (cssStart === -1 || pos < cssStart)) {
          cssStart = pos;
        }
      }

      if (cssStart > 0) {
        // Try to find the end of the CSS block
        const cssEnd = cleanedText.indexOf("}", cssStart);
        if (cssEnd > cssStart) {
          cleanedText = cleanedText.substring(0, cssStart) + cleanedText.substring(cssEnd + 1);
        } else {
          // If we can't find the closing brace, just take the text before the CSS
          cleanedText = cleanedText.substring(0, cssStart);
        }
      }

      // Remove any other CSS-like fragments and common patterns
      cleanedText = cleanedText
        .replace(/;position:[^;]+/g, '')
        .replace(/position:abso\/ute[^;]+/g, '')
        .replace(/;font-[^;]+/g, '')
        .replace(/;color:[^;]+/g, '')
        .replace(/;co\/or:[^;]+/g, '')
        .replace(/;line-[^;]+/g, '')
        .replace(/;\/ine-[^;]+/g, '')
        .replace(/;left:[^;]+/g, '')
        .replace(/;\/eft:[^;]+/g, '')
        .replace(/;top:[^;]+/g, '')
        .replace(/;font-fami\/y:[^;]+/g, '')
        .replace(/Learning New Language$/, '')
        .replace(/Riding with my new Bike$/, '')
        .replace(/\}\}\;\}$/, '')
        .trim();
    }

    return cleanedText;
  };

  const cleanedText = cleanCaptionText(caption.text);
  const [editedText, setEditedText] = useState(cleanedText);

  const handleCopy = () => {
    const fullCaption = `${cleanedText} ${caption.hashtags?.join(' ') || ''}`;
    navigator.clipboard.writeText(fullCaption);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // Make sure to clean the edited text before saving
    const cleanedEditedText = cleanCaptionText(editedText);
    onEdit({ ...caption, text: cleanedEditedText });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedText(cleanedText);
    setIsEditing(false);
  };

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <Card
      className={`caption-card ${isSelected ? 'caption-selected' : ''}`}
      sx={{
        mb: 3,
        border: isSelected ? 2 : 1,
        borderColor: isSelected ? 'primary.main' : 'grey.100',
        boxShadow: isSelected
          ? '0 8px 32px rgba(64, 93, 230, 0.2)'
          : '0 4px 20px rgba(0, 0, 0, 0.05)',
        borderRadius: 3,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: isSelected
            ? '0 12px 40px rgba(64, 93, 230, 0.25)'
            : '0 8px 30px rgba(0, 0, 0, 0.1)',
        },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent sx={{ flex: 1, p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: isSelected
                  ? 'linear-gradient(45deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C)'
                  : 'rgba(64, 93, 230, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isSelected ? 'white' : 'primary.main',
                fontWeight: 'bold',
                fontSize: '14px',
                textTransform: 'uppercase',
              }}
            >
              {caption.style.charAt(0)}
            </Box>
            <Typography
              variant="subtitle1"
              sx={{
                textTransform: 'capitalize',
                fontWeight: 600,
                color: isSelected ? 'primary.main' : 'text.primary',
              }}
            >
              {caption.style}
            </Typography>
          </Box>

          {isSelected && (
            <Chip
              label="Selected"
              color="primary"
              size="small"
              sx={{
                fontWeight: 'bold',
                borderRadius: '12px',
                px: 1,
              }}
            />
          )}
        </Box>

        {isEditing ? (
          <TextField
            fullWidth
            multiline
            rows={4}
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            variant="outlined"
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
        ) : (
          <Typography
            variant="body1"
            paragraph
            sx={{
              mb: 3,
              lineHeight: 1.6,
              fontSize: '1rem',
            }}
          >
            {cleanedText}
          </Typography>
        )}

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.8,
            mb: 2
          }}
        >
          {caption.hashtags?.map((hashtag, index) => (
            <Chip
              key={index}
              label={hashtag}
              size="small"
              color="secondary"
              variant="outlined"
              sx={{
                borderRadius: '12px',
                fontWeight: 500,
                fontSize: '0.75rem',
              }}
            />
          ))}
        </Box>

        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: 'rgba(0, 0, 0, 0.02)',
              borderRadius: 2,
            }}
          >
            {caption.emojis && caption.emojis.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  fontWeight="600"
                  sx={{ mb: 0.5 }}
                >
                  Suggested Emojis:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontSize: '1.2rem', letterSpacing: '0.1em' }}
                >
                  {caption.emojis.join(' ')}
                </Typography>
              </Box>
            )}

            {caption.formatting && (
              <Box>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  fontWeight="600"
                  sx={{ mb: 0.5 }}
                >
                  Formatting Suggestions:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ lineHeight: 1.6 }}
                >
                  {caption.formatting}
                </Typography>
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>

      <CardActions
        sx={{
          justifyContent: 'space-between',
          px: 3,
          pb: 3,
          pt: 0,
          borderTop: expanded ? 1 : 0,
          borderColor: 'divider',
          mt: expanded ? 2 : 0,
        }}
      >
        <Box>
          {isEditing ? (
            <>
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={handleSave}
                startIcon={<CheckIcon />}
                sx={{
                  mr: 1,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Save
              </Button>
              <Button
                size="small"
                onClick={handleCancel}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                size="small"
                variant="outlined"
                onClick={handleEdit}
                startIcon={<EditIcon />}
                sx={{
                  mr: 1,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                }}
              >
                Edit
              </Button>
              <IconButton
                size="small"
                onClick={handleCopy}
                color="primary"
                sx={{
                  bgcolor: 'rgba(64, 93, 230, 0.08)',
                  '&:hover': {
                    bgcolor: 'rgba(64, 93, 230, 0.15)',
                  }
                }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Box>

        <Box>
          <Button
            size="small"
            onClick={handleExpandClick}
            endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            {expanded ? 'Less' : 'More'}
          </Button>
          {!isEditing && (
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={() => onSelect(caption)}
              disabled={isSelected}
              sx={{
                ml: 1,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 10px rgba(64, 93, 230, 0.25)',
                '&:hover': {
                  boxShadow: '0 6px 15px rgba(64, 93, 230, 0.35)',
                }
              }}
            >
              {isSelected ? 'Selected' : 'Select'}
            </Button>
          )}
        </Box>
      </CardActions>
    </Card>
  );
};

export default CaptionCard;