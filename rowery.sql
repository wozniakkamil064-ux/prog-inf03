CREATE DATABASE IF NOT EXISTS inf03_rowery
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE inf03_rowery;

CREATE TABLE typy (
  id INT PRIMARY KEY,
  nazwa VARCHAR(30) NOT NULL
);

CREATE TABLE rowery (
  id INT PRIMARY KEY,
  typ_id INT NOT NULL,
  nazwa VARCHAR(50) NOT NULL,
  stawka DECIMAL(5, 2) NOT NULL,
  dostepny BOOLEAN NOT NULL,
  FOREIGN KEY (typ_id) REFERENCES typy(id)
);

INSERT INTO typy (id, nazwa) VALUES
  (1, 'Miejski'),
  (2, 'Trekkingowy'),
  (3, 'Górski');

INSERT INTO rowery (id, typ_id, nazwa, stawka, dostepny) VALUES
  (1, 1, 'Aleja', 12.50, 1),
  (2, 1, 'Rondo', 11.00, 1),
  (3, 2, 'Szlak', 16.50, 0),
  (4, 2, 'Most', 15.00, 1),
  (5, 3, 'Szczyt', 19.00, 0);
