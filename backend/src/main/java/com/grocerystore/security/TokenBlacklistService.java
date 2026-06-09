package com.grocerystore.security;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TokenBlacklistService {

    private final Map<String, Long> blacklistedTokens = new ConcurrentHashMap<>();

    public void blacklistToken(String token, long expiresAtEpochMillis) {
        blacklistedTokens.put(token, expiresAtEpochMillis);
    }

    public boolean isBlacklisted(String token) {
        Long expiry = blacklistedTokens.get(token);
        if (expiry == null) {
            return false;
        }
        if (expiry < System.currentTimeMillis()) {
            blacklistedTokens.remove(token);
            return false;
        }
        return true;
    }
}
