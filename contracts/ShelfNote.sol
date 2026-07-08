// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ShelfNote {
    uint256 public nextNoteId = 1;

    struct Note {
        address reader;
        string title;
        string author;
        string topic;
        string note;
        uint256 createdAt;
    }

    mapping(uint256 => Note) private notes;

    event NoteSaved(
        uint256 indexed noteId,
        address indexed reader,
        string title,
        string author,
        string topic
    );

    function saveNote(
        string calldata title,
        string calldata author,
        string calldata topic,
        string calldata note
    ) external returns (uint256 noteId) {
        require(bytes(title).length > 0 && bytes(title).length <= 56, "Invalid title");
        require(bytes(author).length > 0 && bytes(author).length <= 48, "Invalid author");
        require(bytes(topic).length > 0 && bytes(topic).length <= 40, "Invalid topic");
        require(bytes(note).length > 0 && bytes(note).length <= 240, "Invalid note");

        noteId = nextNoteId++;
        notes[noteId] = Note({
            reader: msg.sender,
            title: title,
            author: author,
            topic: topic,
            note: note,
            createdAt: block.timestamp
        });

        emit NoteSaved(noteId, msg.sender, title, author, topic);
    }

    function getNote(
        uint256 noteId
    )
        external
        view
        returns (
            address reader,
            string memory title,
            string memory author,
            string memory topic,
            string memory note,
            uint256 createdAt
        )
    {
        Note storage entry = notes[noteId];
        return (
            entry.reader,
            entry.title,
            entry.author,
            entry.topic,
            entry.note,
            entry.createdAt
        );
    }
}
