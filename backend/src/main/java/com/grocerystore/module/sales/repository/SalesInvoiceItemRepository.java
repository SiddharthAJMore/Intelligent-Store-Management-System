package com.grocerystore.module.sales.repository;

import com.grocerystore.module.sales.entity.SalesInvoiceItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface SalesInvoiceItemRepository extends JpaRepository<SalesInvoiceItem, Long> {
    List<SalesInvoiceItem> findByInvoiceId(Long invoiceId);

    @Query("SELECT sii.product.id, SUM(sii.quantity) FROM SalesInvoiceItem sii JOIN sii.invoice si WHERE si.createdAt >= :fromDate GROUP BY sii.product.id ORDER BY SUM(sii.quantity) DESC")
    List<Object[]> findTopProductUnitsSince(@Param("fromDate") LocalDateTime fromDate, Pageable pageable);

    @Query("SELECT sii.product.id, SUM(sii.quantity) FROM SalesInvoiceItem sii GROUP BY sii.product.id ORDER BY SUM(sii.quantity) DESC")
    List<Object[]> findTopProductUnits(Pageable pageable);
}
