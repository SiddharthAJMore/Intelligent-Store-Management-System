package com.grocerystore.module.sales.repository;

import com.grocerystore.module.sales.entity.SalesInvoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface SalesInvoiceRepository extends JpaRepository<SalesInvoice, Long> {
    Optional<SalesInvoice> findByInvoiceNumber(String invoiceNumber);

    @Query("SELECT s FROM SalesInvoice s WHERE " +
           "s.createdAt >= :fromDate AND s.createdAt <= :toDate " +
           "ORDER BY s.createdAt DESC")
    Page<SalesInvoice> findByCreatedAtRange(
        @Param("fromDate") LocalDateTime fromDate,
        @Param("toDate") LocalDateTime toDate,
        Pageable pageable
    );
}
