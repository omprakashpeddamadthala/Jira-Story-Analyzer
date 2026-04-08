package com.jiranalyzer.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RephraseResponse {

    private String originalTitle;
    private String originalDescription;
    private String originalAcceptanceCriteria;

    private String rephrasedTitle;
    private String rephrasedDescription;
    private String rephrasedAcceptanceCriteria;
}
