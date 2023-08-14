-- Get Study location overview similar to the one on CT
-- https://clinicaltrials.gov/ct2/results/map?term=Cetirizine+OR+Levocetirizine+OR+Fexofenadine+OR+Loratadine+OR+Desloratadine&map=
SELECT country, count(*) cou, sum(c) from (
	SELECT e.id, e."NCTId", l.country, count(*) c from "LocationOnEntries" le
	JOIN "Location" l ON l.id = le."locationId"
	JOIN "Entry" e ON e.id = le."entryId"
	-- WHERE e.repurpose
	GROUP BY e.id, l.country
	ORDER BY "NCTId"
) d
GROUP By country
ORDER BY cou DESC