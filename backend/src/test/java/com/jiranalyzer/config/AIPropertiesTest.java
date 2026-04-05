package com.jiranalyzer.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AIPropertiesTest {

    @Test
    void shouldHaveDefaultProviderAsOpenAI() {
        AIProperties properties = new AIProperties();
        assertEquals("openai", properties.getProvider());
    }

    @Test
    void shouldHaveDefaultOpenAIModel() {
        AIProperties properties = new AIProperties();
        assertEquals("gpt-4o", properties.getOpenai().getModel());
    }

    @Test
    void shouldHaveDefaultGeminiModel() {
        AIProperties properties = new AIProperties();
        assertEquals("gemini-2.0-flash", properties.getGemini().getModel());
    }

    @Test
    void shouldHaveDefaultTemperature() {
        AIProperties properties = new AIProperties();
        assertEquals(0.7, properties.getOpenai().getTemperature());
        assertEquals(0.7, properties.getGemini().getTemperature());
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

        properties.getOpenai().setModel("gpt-3.5-turbo");
        assertEquals("gpt-3.5-turbo", properties.getOpenai().getModel());

        properties.getGemini().setModel("gemini-1.5-pro");
        assertEquals("gemini-1.5-pro", properties.getGemini().getModel());
    }

    @Test
    void shouldAllowSettingTemperature() {
        AIProperties properties = new AIProperties();

        properties.getOpenai().setTemperature(0.5);
        assertEquals(0.5, properties.getOpenai().getTemperature());

        properties.getGemini().setTemperature(0.9);
        assertEquals(0.9, properties.getGemini().getTemperature());
    }

    @Test
    void shouldHaveEmptyDefaultApiKeys() {
        AIProperties properties = new AIProperties();
        assertEquals("", properties.getOpenai().getApiKey());
        assertEquals("", properties.getGemini().getApiKey());
    }
}
