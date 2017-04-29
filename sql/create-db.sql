CREATE TABLE lublu_post (
	id SERIAL PRIMARY KEY,
	title VARCHAR(255),
	content TEXT,
	is_published BOOLEAN DEFAUlT FALSE,
	date_published TIMESTAMPTZ DEFAULT NULL,
	date_updated TIMESTAMPTZ
);

CREATE TABLE lublu_tag (
	id SERIAL PRIMARY KEY,
	tag CITEXT UNIQUE
);

CREATE TABLE lublu_tag_join (
	id SERIAL PRIMARY KEY,
	post_id INTEGER NOT NULL REFERENCES lublu_post(id) ON DELETE CASCADE,
	tag_id INTEGER NOT NULL REFERENCES lublu_tag(id) ON DELETE CASCADE,
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
		WHEN(OLD.content IS DISTINCT FROM NEW.content OR OLD.title IS DISTINCT FROM NEW.title)
			EXECUTE PROCEDURE set_date_updated();

CREATE OR REPLACE FUNCTION set_date_published()	
RETURNS TRIGGER AS $$
BEGIN
	NEW.date_published = now();
	RETURN NEW;	
END;
$$ language 'plpgsql';

CREATE TRIGGER insert_date_published BEFORE INSERT ON lublu_post
	FOR EACH ROW
		WHEN(NEW.is_published = TRUE)
			EXECUTE PROCEDURE set_date_published();

CREATE TRIGGER update_date_published BEFORE UPDATE OF is_published ON lublu_post
	FOR EACH ROW
		WHEN(OLD.is_published = FALSE AND NEW.is_published = TRUE)
			EXECUTE PROCEDURE set_date_published();