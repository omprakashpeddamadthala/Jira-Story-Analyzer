package com.jiranalyzer.service;

import com.jiranalyzer.dto.request.ApplyChangesRequest;
import com.jiranalyzer.dto.response.ApplyChangesResponse;

public interface ChangeApplyService {

    ApplyChangesResponse applyChanges(ApplyChangesRequest request);
}
