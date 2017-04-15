DROP TABLE IF EXISTS lublu_tag_join;
DROP TABLE IF EXISTS lublu_tag;
DROP TABLE IF EXISTS lublu_post;

CREATE TABLE lublu_post (
	id SERIAL PRIMARY KEY,
	title VARCHAR(255),
	content TEXT,
	date_published TIMESTAMPTZ DEFAULT now(),
	date_updated TIMESTAMPTZ,
	is_published BOOLEAN DEFAUlT FALSE
);

CREATE TABLE lublu_tag (
	id SERIAL PRIMARY KEY,
	tag VARCHAR(100) UNIQUE
);

CREATE TABLE lublu_tag_join (
	id SERIAL PRIMARY KEY,
	post_id INTEGER REFERENCES lublu_post(id) ON DELETE CASCADE,
	tag_id INTEGER REFERENCES lublu_tag(id) ON DELETE RESTRICT,
	UNIQUE(post_id, tag_id)
);

CREATE OR REPLACE FUNCTION set_date_updated()	
RETURNS TRIGGER AS $$
BEGIN
	NEW.date_updated = now();
	RETURN NEW;	
END;
$$ language 'plpgsql';

CREATE TRIGGER update_date_updated BEFORE UPDATE OF title, content ON lublu_post
	FOR EACH ROW
	WHEN(OLD.content IS DISTINCT FROM NEW.content OR 
		 OLD.title IS DISTINCT FROM NEW.title)
	EXECUTE PROCEDURE set_date_updated();

