# Bulk Import Format Proposal

## File format
* Two separate CSV files, one for users and one for students.
    * CSV is defined as in [RFC 4180, Section 2](https://datatracker.ietf.org/doc/html/rfc4180#section-2)
        * The optional header line in [RFC 4180, Section 2.3](https://datatracker.ietf.org/doc/html/rfc4180#section-2) is required for these files
* If the files exist (defined below) they will each have at minimum two lines--the header and a record that follows the defined formatting
* "Field is not empty" indicates that at least one character must be present in the field


## Users file
Fields appear in the following order in the users file as follows: `email,name,address,phone_number`. This is also the contents of the first line in the file. This file only exists if importing user(s) is desired. 

* `email` field: 
    - character limit: `<= 254 chars` as per [RFC 5321, Section 4.5.3.1.3](https://datatracker.ietf.org/doc/html/rfc5321#section-4.5.3.1.3) 
    - must be a valid address as per the addr-spec of [RFC 5322, Section 3.4.1](https://datatracker.ietf.org/doc/html/rfc5322#section-3.4.1)
    - field is not empty
        - example: `john.smith@example.com`, `john.smith@cs.duke.edu`

* `name` field:
    - character limit: `<= 150 chars`
    - field is not empty
    - some text field containing both a first and last name with potential suffixes (eg `Jr`, `Sr`, `III`, etc)
        - example: ``"John Smith Jr"``

* `address` field:
    - character limit: `<= 150 chars`
    - some text that is a Complete Address as per [USPS Standard 602.1.4](https://pe.usps.com/text/dmm300/602.htm#ep1085515).
        - Adressee Name (USPS Standard 602.1.4.2a) is not applicable and is not included in this field
        - The delimiter between Address Elements (USPS Standard 602.1.4.2) must match the regex `,? +`
    - field is not empty
        - example: `"998 Chevis Rd, Savannah, GA 31419"`

* `phone_number` field:
    - character limit: `<= 35 chars`, including characters for formatting
    - field may be left empty
        - some implementations of the software may require phone numbers, as per Variance Request #79 – if this is the case and the phone number is left blank, then it is up to the group's implementation to either reject the record with an appropriate error message or mark the phone number as 0000000000.
    - example: `19198776589`, `(555) 555-5555`, `+1 415 555 0132`

## Students file
Fields appear in the following order in `Students.csv` as follows: `name,parent_email,student_id,school_name`. This is also the contents of the first line in the file. This file only exists if importing student(s) is desired.

* `name` field:
    - character limit: `<= 150 chars`
    - field is not empty
    - some text field containing both a first and last name with potential suffixes (eg `Jr`, `Sr`, `III`, etc)
        - example: ``"John Smith Jr"``
    
* `parent_email` field: 
    - character limit: `<= 254 chars` as per [RFC 5321, Section 4.5.3.1.3](https://datatracker.ietf.org/doc/html/rfc5321#section-4.5.3.1.3) 
    - must be a valid address as per the addr-spec of [RFC 5322, Section 3.4.1](https://datatracker.ietf.org/doc/html/rfc5322#section-3.4.1)
    - field is not empty
        - example: `john.smith@example.com`, `john.smith@cs.duke.edu`
    
* `student_id` field: 
    - some non-zero, positive (but less than `2147483647`) number. As this is an optional field, if there is no desired student id the field is left empty.
        - some implementations of the software may require student_id, as per Variance Request #37 - if this is the case and the student id is left blank, then it is up to the group's implementation to either reject the record with an appropriate error message or mark the student id as 0.
        - example: `24601`
    
 * `school_name` field:
    - character limit: `<= 150 chars`
    - school name must case-insensitively and whitespace-insensitively match an existing school name, or else the record will be rejected with an appropriate error message
        - for example, "A School" matches "   a sCHoOl   " and "A          School" but not "aschool"
    - field is not empty
        - example: `"Duke University"`