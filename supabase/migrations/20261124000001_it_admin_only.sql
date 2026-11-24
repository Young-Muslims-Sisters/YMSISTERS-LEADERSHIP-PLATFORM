-- The IT dashboard is limited to the IT lead's own account, not the shared mailbox.
delete from private.it_admins where email = 'shura@ymsisters.com';
