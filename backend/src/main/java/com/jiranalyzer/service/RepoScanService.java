package com.jiranalyzer.service;

import com.jiranalyzer.dto.response.RepoScanResponse;

public interface RepoScanService {

    RepoScanResponse scanFolder(String folderPath);

    RepoScanResponse getCachedScan(String folderPath);

    boolean hasCachedScan(String folderPath);
}
