package com.grocerystore.module.inventory.repository;

import com.grocerystore.module.inventory.entity.Inventory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    Optional<Inventory> findByProductId(Long productId);

    @Query("SELECT i FROM Inventory i " +
            "WHERE i.quantity <= i.lowStockThreshold + 10")
    Page<Inventory> findLowStock(Pageable pageable);

    @Query("SELECT i FROM Inventory i " +
            "ORDER BY (i.quantity - i.lowStockThreshold) ASC")
    Page<Inventory> findAllOrderByStatusAsc(Pageable pageable);

    @Query("SELECT i FROM Inventory i " +
            "ORDER BY (i.quantity - i.lowStockThreshold) DESC")
    Page<Inventory> findAllOrderByStatusDesc(Pageable pageable);
}
