SELECT
 date_part('year', e."StudyFirstPostDate"::date) as year, COUNT(*) as count, avg(date_part('year', e."StudyFirstPostDate"::date) - date_part('year', e."StartDate"::date)) as avg_lag_years
FROM
	"Entry" e
WHERE date_part('year', e."StartDate"::date) < date_part('year', e."StudyFirstPostDate"::date)
AND NOT e.drug_role IN ('minimal', 'not included', 'rescue medication')
GROUP BY year
ORDER BY
	YEAR