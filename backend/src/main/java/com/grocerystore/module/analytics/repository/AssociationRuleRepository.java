package com.grocerystore.module.analytics.repository;

import com.grocerystore.module.analytics.entity.AssociationRule;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssociationRuleRepository extends JpaRepository<AssociationRule, Long> {
}
