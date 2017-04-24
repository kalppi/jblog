INSERT INTO lublu_post (title, content) VALUES ('test', 'test content'), ('test2', 'test content 2'), ('test3', 'test content 3');

INSERT INTO lublu_tag (tag) VALUES ('linux'), ('postgres'), ('database'), ('node'), ('php');

INSERT INTO lublu_tag_join (post_id, tag_id) VALUES (1, 1), (1, 3), (1, 4), (2, 2), (2, 4);