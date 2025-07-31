# Serveur Echo TCP mono-client
# Renvoie tous les messages reçus du client
#


#-_-_-_-_-_-_-_-_-_-_-_ Serveur Socket -_-_-_-_-_-_-_-_-_-_-_ 

import socket
import sys

# Création de la fonction main
def main():



    # Configuration du serveur
    HOST = 'localhost'
    PORT = 9999

    # Création du socket serveur
    serveur = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    # Permettre au socket de réutiliser une adresse déjà utilisée
    serveur.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

    try:
        # Lier la configuration au socket
        serveur.bind((HOST, PORT))

        serveur.listen(1)

        print(f"En attente d'une connexion sur le port :\t{PORT}\n")

        # Accepter la connexion du client
        client, client_adr = serveur.accept()
        print(f"Connexion client établie\tAdresse client : {client_adr}\n")

        # Entrons dans une boucle infinie pour récupérer les données
        while True:
            try:
                # Réception des données (buffer de 1024 octets)
                data_client = client.recv(1024)

                # Vérifions si le client est toujours connecté
                if not data_client:
                    print("Le client est déconnecté.\n")
                    # Sortir de la boucle infinie
                    break

                # Sinon, décodons le message
                message = data_client.decode("utf-8")

                # Affichons le message reçu du client
                print(f"Reçu du client: {repr(message)}")

                # Renvoyer le message au client
                client.send(data_client)
                print(f"Renvoyé : {repr(message)}")

            # Gérer les exceptions

            # Rupture de la connexion par le client
            except ConnectionResetError:
                print("Connexion stoppée par le client.\n")
                break

            # Erreur liée au décodage
            except UnicodeDecodeError:
                print("Erreur de décodage.\n")
                break

    # Arrêt du serveur
    except KeyboardInterrupt:
        print("\nArrêt du serveur.\n")

    # Afficher l'erreur si le socket rencontre un problème
    except OSError as e:
        print(f"Erreur rencontrée par le socket serveur : {e}\n")

    finally:
        # Fermer le socket client s'il existe
        try:
            client.close()
        except:
            pass

        # Fermer le socket serveur
        serveur.close()
        print("Serveur fermé.")

if __name__ == "__main__":
    main()


