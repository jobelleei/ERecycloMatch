-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: May 08, 2026 at 05:58 AM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `capstone_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `approved_facilities`
--

CREATE TABLE `approved_facilities` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `location` text DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `contactNum` varchar(50) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `certification` varchar(255) DEFAULT NULL,
  `approved_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `approved_facilities`
--

INSERT INTO `approved_facilities` (`id`, `name`, `location`, `email`, `contactNum`, `password`, `certification`, `approved_at`) VALUES
(2, 'world', 'world', 'world', '8392749201', '$2y$10$Io1p1p6uzR87iWUQeOxJCO85iINPv9rPHaQvyh6V5jqZ5yqMTg9f.', '1777740357_upload.jpg', '2026-05-02 17:52:16'),
(3, 'ambot', 'ambot', 'ambot', '9393627', '$2y$10$.flF1k1G9hLfgjIMjZI5euV5C9ZpuaqHLDB4CAkqLxnS5fY/Pu19i', '1777740388_upload.jpg', '2026-05-02 18:08:15'),
(4, 'sample', 'sample', 'sample', 'sample', '$2y$10$/L8i7xsxs7BtrJuhHO/MfuU35w4KOVTVV22P9IZ.Cxdj.cxCIGAGu', '1777772106_upload.jpg', '2026-05-07 19:23:53');

-- --------------------------------------------------------

--
-- Table structure for table `approved_individuals`
--

CREATE TABLE `approved_individuals` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `id_image` varchar(255) DEFAULT NULL,
  `approved_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `approved_individuals`
--

INSERT INTO `approved_individuals` (`id`, `name`, `email`, `address`, `password`, `id_image`, `approved_at`) VALUES
(1, 'artot dulacs', 'artotdulacs@gmail.com', 'Brgy. Taloc, Bago City', '$2y$10$9b1caL8Tf3Iqb2U4SNVXO.oZL0Im8UklyF5RwolGMp1jun6lMnM4S', '1777736255_upload.jpg', '2026-05-02 15:37:44'),
(2, 'match', 'match', 'match', '$2y$10$DPrD4K/G8TUisTMwmssZlOGaHwERfXNm2RzhrSBHFl4ruKofqiSe.', '1777771975_upload.jpg', '2026-05-03 01:35:33'),
(3, 'user', 'user', 'user', '$2y$10$536760OCtIH0CAIhWOMO0.zZYbDCoAXRelRdvv2trtzhgDgrHIaBy', '1777772007_upload.jpg', '2026-05-03 01:59:26'),
(4, 'hello', 'hello', 'hello', '$2y$10$nHm48O89keS1eLehoEAXIubHzWur/2oHX6Bam3e5f/HvRUG6edjg.', '1778179396_upload.jpg', '2026-05-07 19:16:49');

-- --------------------------------------------------------

--
-- Table structure for table `pending_facilities`
--

CREATE TABLE `pending_facilities` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `location` text DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `contactNum` varchar(50) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `certification` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pending_individuals`
--

CREATE TABLE `pending_individuals` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `id_image` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pending_individuals`
--

INSERT INTO `pending_individuals` (`id`, `name`, `email`, `address`, `password`, `id_image`, `created_at`) VALUES
(12, 'hello', 'hello', 'hello', '$2y$10$q9jhdjL9SDCFgqm78S/pVuCgGCQhCkPZPKjmD.CRQR1MxBM7WEYwu', '1778179400_upload.jpg', '2026-05-07 18:43:20'),
(13, 'hello', 'hello', 'hello', '$2y$10$3n/Ok4x1uWSDjgyJhWNo.eHAYjmE3ydXf/vadUeLvuLLZ0xfZRo7.', '1778179403_upload.jpg', '2026-05-07 18:43:23'),
(14, 'idk', 'idk', 'idk', '$2y$10$DeLtf6q70/6C4V5vnusHEu74Ng60l09KhbCMAhQlkd.j/s6bb9HQe', '1778179440_upload.jpg', '2026-05-07 18:44:00');

-- --------------------------------------------------------

--
-- Table structure for table `rejected_facilities`
--

CREATE TABLE `rejected_facilities` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `location` text DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `contactNum` varchar(50) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `certification` varchar(255) DEFAULT NULL,
  `rejected_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reject_reason` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rejected_facilities`
--

INSERT INTO `rejected_facilities` (`id`, `name`, `location`, `email`, `contactNum`, `password`, `certification`, `rejected_at`, `reject_reason`) VALUES
(1, 'helsldbdb', 'hekansbsb', 'hoans dhsi', '9373918574', '$2y$10$lJIn/Y331z9344abs2Vrmeu5wMxkrMiB/ZP4HF2JwRioqUZuP4Y.6', '1777740074_upload.jpg', '2026-05-02 17:03:04', 'Incomplete documents'),
(2, 'idk', 'idk', 'idk', '83926283', '$2y$10$CDOIXbdsy4kW6s55BlwCouTLsOFKn2a5v2KVM4tozMIpPkN4bmCGW', '1778179464_upload.jpg', '2026-05-07 19:23:58', 'Fake facility');

-- --------------------------------------------------------

--
-- Table structure for table `rejected_individuals`
--

CREATE TABLE `rejected_individuals` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `id_image` varchar(255) DEFAULT NULL,
  `rejected_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reject_reason` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rejected_individuals`
--

INSERT INTO `rejected_individuals` (`id`, `name`, `email`, `address`, `password`, `id_image`, `rejected_at`, `reject_reason`) VALUES
(1, 'hello', 'world', 'jababsjjd', '$2y$10$1m79kP2rK3km0KnhXNHML.aZNU7uhOQgx6QJhX7.IgqpWzp6v5M9y', '1777736178_upload.jpg', '2026-05-02 16:08:33', 'Invalid ID'),
(2, 'ricarts montaner', 'ricartsmontaner@gmail.com', 'Silay City', '$2y$10$uwIgWf2uOB3cXPeeG.OvxuW2yo1QGZ2N/.FfefYl/4blTLg2Ou0jO', '1777736320_upload.jpg', '2026-05-02 16:28:50', 'Fake information'),
(4, 'idk', 'idk', 'idk', '$2y$10$36C4RWrvQ3eKXBTdquoodumOVFiKzOOvvB54jE6vWEzUW8Ypg3LCG', '1777771951_upload.jpg', '2026-05-03 02:01:35', 'Invalid ID'),
(5, 'image', 'image', 'image', '$2y$10$GOR3zZjhqKyoUb5QVv1l5Oky9lGupoXqh3Y3k1.G14drpsCiSma5q', '1777772032_upload.jpg', '2026-05-07 15:30:02', 'Fake user'),
(6, 'hello', 'hello', 'hello', '$2y$10$VlZRxiqxNc6lUotRUEw.KuXhI39yAWE4dhLI7epQSMXtrf/U7s9x6', '1778179397_upload.jpg', '2026-05-07 19:17:00', 'Invalid ID');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `approved_facilities`
--
ALTER TABLE `approved_facilities`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `approved_individuals`
--
ALTER TABLE `approved_individuals`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `pending_facilities`
--
ALTER TABLE `pending_facilities`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `pending_individuals`
--
ALTER TABLE `pending_individuals`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `rejected_facilities`
--
ALTER TABLE `rejected_facilities`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `rejected_individuals`
--
ALTER TABLE `rejected_individuals`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `approved_facilities`
--
ALTER TABLE `approved_facilities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `approved_individuals`
--
ALTER TABLE `approved_individuals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `pending_facilities`
--
ALTER TABLE `pending_facilities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `pending_individuals`
--
ALTER TABLE `pending_individuals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `rejected_facilities`
--
ALTER TABLE `rejected_facilities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `rejected_individuals`
--
ALTER TABLE `rejected_individuals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
