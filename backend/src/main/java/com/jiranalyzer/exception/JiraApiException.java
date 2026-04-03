package com.jiranalyzer.exception;

public class JiraApiException extends RuntimeException {

    public JiraApiException(String message) {
        super(message);
    }

    public JiraApiException(String message, Throwable cause) {
        super(message, cause);
    }
}
