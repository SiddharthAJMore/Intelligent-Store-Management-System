package com.grocerystore.module.analytics.repository;

import com.grocerystore.module.analytics.entity.RestockSuggestion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RestockSuggestionRepository extends JpaRepository<RestockSuggestion, Long> {
}
