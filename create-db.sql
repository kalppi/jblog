DROP TABLE IF EXISTS jblog_tag_join;
DROP TABLE IF EXISTS jblog_tag;
DROP TABLE IF EXISTS jblog_post;

CREATE TABLE jblog_post (id SERIAL PRIMARY KEY, title VARCHAR(255), content TEXT,
	date_published TIMESTAMPTZ DEFAULT now(), date_updated TIMESTAMPTZ, published BOOLEAN DEFAUlT FALSE);

CREATE OR REPLACE FUNCTION set_date_updated()	
RETURNS TRIGGER AS $$
BEGIN
	NEW.date_updated = now();
	RETURN NEW;	
END;
$$ language 'plpgsql';

CREATE TRIGGER update_date_updated BEFORE UPDATE OF title, content ON jblog_post
	FOR EACH ROW
	WHEN(OLD.content IS DISTINCT FROM NEW.content OR 
		 OLD.title IS DISTINCT FROM NEW.title)
	EXECUTE PROCEDURE set_date_updated();

CREATE TABLE jblog_tag (id SERIAL PRIMARY KEY, tag VARCHAR(100) UNIQUE);

CREATE TABLE jblog_tag_join (id SERIAL PRIMARY KEY, post_id INTEGER REFERENCES jblog_post(id),
	tag_id INTEGER REFERENCES jblog_tag(id));