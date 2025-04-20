const express = require('express');
const router = express.Router();
require('dotenv').config();

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: 'your_actual_openai_api_key_here',
});

// This endpoint expects a JSON payload with a "prompt" property.
router.post('/find-complexity', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ success: false, error: "No prompt provided" });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert professional email writing assistant. Your task is to generate a professional and heartfelt email based on key points provided by the user. Please generate both an email subject and email body. Return the result as a JSON object with keys 'subject' and 'body'. Ensure the JSON is valid.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 300,
      temperature: 0.2,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    });

    // Parse the JSON response from OpenAI.
    const output = JSON.parse(response.choices[0].message.content);
    
    return res.status(200).json({
      success: true,
      subject: output.subject,
      emailBody: output.body,
    });
  } catch (error) {
    console.error("Error making OpenAI request:", error);
    return res.status(400).json({
      success: false,
      error: error.response ? error.response.data : "There was an issue on the server",
    });
  }
});

module.exports = router;
