CREATE TABLE isupplier_event_detail(
    id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    entity varchar(120) DEFAULT NULL,
    supplier_name varchar(120) DEFAULT NULL,
    event_title varchar(240) DEFAULT NULL,
    `date` date DEFAULT NULL,
    suplier_fact int(5) DEFAULT NULL,
    events_participated int(5) DEFAULT NULL,
    events_awarded int(5) DEFAULT NULL
);

CREATE TABLE isupplier_spm_scoring_detail(
    id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    entity varchar(120) DEFAULT NULL,
    commodity varchar(240) DEFAULT NULL,
    erp_suplier varchar(120) DEFAULT NULL,
    project_name varchar(120) DEFAULT NULL,
    user varchar(120) DEFAULT NULL,
    kpi varchar(120) DEFAULT NULL,
    performance_period_from_year date DEFAULT NULL,
    performance_period_from_month date DEFAULT NULL,
    performance_period_to_year date DEFAULT NULL,
    performance_period_to_month date DEFAULT NULL,
    average_grade int(5) DEFAULT NULL
);