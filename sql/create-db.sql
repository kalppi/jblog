CREATE TABLE lublu_blog (
	id SERIAL PRIMARY KEY,
	name CITEXT UNIQUE NOT NULL
);

CREATE TABLE lublu_user (
	id SERIAL PRIMARY KEY,
	name CITEXT UNIQUE NOT NULL
);

CREATE TABLE lublu_post (
	id SERIAL PRIMARY KEY,
	blog_id INTEGER NOT NULL REFERENCES lublu_blog(id) ON DELETE CASCADE,
	user_id INTEGER NOT NULL REFERENCES lublu_user(id) ON DELETE CASCADE,
	title VARCHAR(255) NOT NULL,
	content TEXT NOT NULL,
	is_published BOOLEAN NOT NULL DEFAUlT FALSE,
	date_published TIMESTAMPTZ DEFAULT NULL,
	date_updated TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX lublu_blog_id_idx ON lublu_post (blog_id);

CREATE TABLE lublu_tag (
	id SERIAL PRIMARY KEY,
	tag CITEXT UNIQUE NOT NULL
);

CREATE TABLE lublu_tag_join (
	id SERIAL PRIMARY KEY,
	post_id INTEGER NOT NULL REFERENCES lublu_post(id) ON DELETE CASCADE,
	tag_id INTEGER NOT NULL REFERENCES lublu_tag(id) ON DELETE CASCADE,
	UNIQUE (post_id, tag_id)
);

CREATE TYPE lublu_user_rights AS ENUM ('none', 'write', 'owner');

CREATE TABLE lublu_rights_join (
	id SERIAL PRIMARY KEY,
	rights lublu_user_rights NOT NULL,
	blog_id INTEGER NOT NULL REFERENCES lublu_blog(id) ON DELETE CASCADE,
	user_id INTEGER NOT NULL REFERENCES lublu_user(id) ON DELETE CASCADE,
	UNIQUE (blog_id, user_id)
);

CREATE INDEX lublu_rights_blog_user_idx ON lublu_rights_join (blog_id, user_id);

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