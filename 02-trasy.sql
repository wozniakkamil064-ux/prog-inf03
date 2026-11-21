CREATE DATABASE IF NOT EXISTS inf03_trasy CHARACTER SET utf8mb4;
USE inf03_trasy;
CREATE TABLE poziomy (id INT PRIMARY KEY, nazwa VARCHAR(50) NOT NULL);
CREATE TABLE trasy (id INT PRIMARY KEY, poziom_id INT NOT NULL, nazwa VARCHAR(80) NOT NULL, km INT NOT NULL, otwarta INT NOT NULL, FOREIGN KEY (poziom_id) REFERENCES poziomy(id));
INSERT INTO poziomy VALUES (1, 'Łatwa'), (2, 'Średnia'), (3, 'Trudna');
INSERT INTO trasy VALUES (1,1,'Łąka',4,1), (2,1,'Park',6,1), (3,2,'Rzeka',9,1), (4,2,'Wzgórze',14,0), (5,3,'Szczyt',18,0);
