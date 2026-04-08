package com.jiranalyzer.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AIPropertiesTest {

    @Test
    void shouldHaveNullProviderByDefault() {
        AIProperties properties = new AIProperties();
        assertNull(properties.getProvider());
    }

    @Test
    void shouldHaveNullApiKeysByDefault() {
        AIProperties properties = new AIProperties();
        assertNull(properties.getOpenai().getApiKey());
        assertNull(properties.getGemini().getApiKey());
    }

    @Test
    void shouldAllowSettingProvider() {
        AIProperties properties = new AIProperties();
        properties.setProvider("gemini");
        assertEquals("gemini", properties.getProvider());
    }

    @Test
    void shouldAllowSettingApiKeys() {
        AIProperties properties = new AIProperties();

        properties.getOpenai().setApiKey("test-openai-key");
        assertEquals("test-openai-key", properties.getOpenai().getApiKey());

        properties.getGemini().setApiKey("test-gemini-key");
        assertEquals("test-gemini-key", properties.getGemini().getApiKey());
    }

    @Test
    void shouldAllowSettingModels() {
        AIProperties properties = new AIProperties();

        properties.getOpenai().setModel("gpt-5-nano");
        assertEquals("gpt-5-nano", properties.getOpenai().getModel());

        properties.getGemini().setModel("gemini-2.0-flash");
        assertEquals("gemini-2.0-flash", properties.getGemini().getModel());
    }

    @Test
    void shouldAllowSettingTemperature() {
        AIProperties properties = new AIProperties();

        properties.getOpenai().setTemperature(1.0);
        assertEquals(1.0, properties.getOpenai().getTemperature());

        properties.getGemini().setTemperature(0.7);
        assertEquals(0.7, properties.getGemini().getTemperature());
    }

    @Test
    void validateShouldThrowWhenProviderIsNull() {
        AIProperties properties = new AIProperties();
        properties.setProvider(null);

        IllegalStateException ex = assertThrows(IllegalStateException.class, properties::validate);
        assertTrue(ex.getMessage().contains("AI provider is not configured"));
    }

    @Test
    void validateShouldThrowWhenProviderIsEmpty() {
        AIProperties properties = new AIProperties();
        properties.setProvider("");

        IllegalStateException ex = assertThrows(IllegalStateException.class, properties::validate);
        assertTrue(ex.getMessage().contains("AI provider is not configured"));
    }

    @Test
    void validateShouldThrowWhenProviderIsUnsupported() {
        AIProperties properties = new AIProperties();
        properties.setProvider("anthropic");

        IllegalStateException ex = assertThrows(IllegalStateException.class, properties::validate);
        assertTrue(ex.getMessage().contains("Unsupported AI provider"));
        assertTrue(ex.getMessage().contains("anthropic"));
    }

    @Test
    void validateShouldPassForOpenAIProvider() {
        AIProperties properties = new AIProperties();
        properties.setProvider("openai");
        properties.getOpenai().setApiKey("test-key");
        properties.getOpenai().setModel("gpt-5-nano");
        properties.getGemini().setModel("gemini-2.0-flash");

        assertDoesNotThrow(properties::validate);
    }

    @Test
    void validateShouldPassForGeminiProvider() {
        AIProperties properties = new AIProperties();
        properties.setProvider("gemini");
        properties.getGemini().setApiKey("test-key");
        properties.getOpenai().setModel("gpt-5-nano");
        properties.getGemini().setModel("gemini-2.0-flash");

        assertDoesNotThrow(properties::validate);
    }

    @Test
    void validateShouldWarnButNotThrowWhenApiKeyMissing() {
        AIProperties properties = new AIProperties();
        properties.setProvider("openai");
        properties.getOpenai().setModel("gpt-5-nano");
        properties.getGemini().setModel("gemini-2.0-flash");
        // No API key set — should warn but not throw
        assertDoesNotThrow(properties::validate);
    }
}
