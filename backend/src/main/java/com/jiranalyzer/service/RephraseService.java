package com.jiranalyzer.service;

import com.jiranalyzer.dto.request.RephraseRequest;
import com.jiranalyzer.dto.response.RephraseResponse;

public interface RephraseService {

    RephraseResponse rephrase(RephraseRequest request);
}
