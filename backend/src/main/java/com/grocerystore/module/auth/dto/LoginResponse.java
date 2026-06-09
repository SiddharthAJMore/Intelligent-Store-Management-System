package com.grocerystore.module.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class LoginResponse {
    private Long userId;
    private String username;
    private String role;
    private String token;
    private long expiresIn;
}
