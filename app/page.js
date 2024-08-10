'use client';

import { Box, Button, Stack, TextField, Avatar, CircularProgress } from '@mui/material';
import { useState, useRef, useEffect } from 'react';
import BotIcon from '@mui/icons-material/SmartToy';
import UserIcon from '@mui/icons-material/Person';

const openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm the Guitar Haven support assistant. How can I help you today?`,
    },
  ]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;
    setIsLoading(true);

    const userMessage = { role: 'user', content: message };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = '';

      const processText = async ({ done, value }) => {
        if (done) return result;
        const text = decoder.decode(value || new Uint8Array(), { stream: true });
        result += text;
        setMessages((prevMessages) => {
          let lastMessage = prevMessages[prevMessages.length - 1];
          let otherMessages = prevMessages.slice(0, prevMessages.length - 1);
          if (lastMessage.role === 'assistant') {
            return [...otherMessages, { ...lastMessage, content: lastMessage.content + text }];
          }
          return [...prevMessages, { role: 'assistant', content: text }];
        });
        return reader.read().then(processText);
      };

      await reader.read().then(processText);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    }

    setIsLoading(false);
    setMessage('');
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      sx={{
        backgroundImage: 'url(https://media.gq.com/photos/58ebf7dcae66e147cc478952/16:9/w_1920,c_limit/retrofret-gq-12.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
      }}
    >
      <Box
        position="absolute"
        top={0}
        left={0}
        width="100%"
        height="100%"
        bgcolor="rgba(255, 255, 255, 0.8)"
        zIndex={1}
      />
      <Stack
        direction="column"
        width="500px"
        height="700px"
        bgcolor="rgba(255, 255, 255, 0.8)"
        borderRadius={4}
        p={2}
        spacing={3}
        sx={{ position: 'relative', zIndex: 2 }}
      >
        <Stack
          direction="column"
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
          sx={{ padding: 1 }}
        >
          {messages.map((msg, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={msg.role === 'user' ? 'flex-start' : 'flex-end'}
            >
              <Box display="flex" alignItems="center">
                {msg.role === 'user' ? (
                  <>
                    <Avatar sx={{ bgcolor: 'secondary.main', mr: 1 }}>
                      <UserIcon />
                    </Avatar>
                    <Box
                      bgcolor="secondary.main"
                      color="white"
                      borderRadius={2}
                      p={2}
                      boxShadow={2}
                      maxWidth="70%"
                      sx={{ ml: 1, mr: 'auto' }} // Adjusted for alignment
                    >
                      <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                    </Box>
                  </>
                ) : (
                  <>
                    <Box
                      bgcolor="primary.main"
                      color="white"
                      borderRadius={2}
                      p={2}
                      boxShadow={2}
                      maxWidth="70%"
                      sx={{ ml: 'auto', mr: 1 }} // Adjusted for alignment
                    >
                      <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                    </Box>
                    <Avatar sx={{ bgcolor: 'primary.main', ml: 1 }}>
                      <BotIcon />
                    </Avatar>
                  </>
                )}
              </Box>
            </Box>
          ))}
          {isLoading && (
            <Box display="flex" justifyContent="flex-end">
              <Box display="flex" alignItems="center">
                <Box
                  bgcolor="primary.main"
                  color="white"
                  borderRadius={2}
                  p={2}
                  boxShadow={2}
                  maxWidth="70%"
                  sx={{ ml: 'auto', mr: 1 }} // Adjusted for alignment
                >
                  <Box display="flex" justifyContent="center" alignItems="center">
                    <CircularProgress size={20} sx={{ color: 'white' }} />
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main', ml: 1 }}>
                  <BotIcon />
                </Avatar>
              </Box>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            variant="outlined"
          />
          <Button
            variant="contained"
            onClick={sendMessage}
            disabled={isLoading}
            sx={{ width: '100px' }}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
